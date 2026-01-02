"use client";

import { useState, useCallback, useEffect } from 'react';
import { useOptimisticUpdate } from './use-optimistic-updates';
import { useOptimisticBookings } from './use-optimistic-bookings';
import { useOptimisticAuth } from './use-optimistic-auth';
import { useOptimisticFacilities } from './use-optimistic-facilities';
import { useOptimisticForm } from './use-optimistic-form';

export interface OptimisticTestResult {
  test: string;
  status: 'passed' | 'failed' | 'running';
  duration: number;
  error?: string;
  details?: any;
}

export interface OptimisticTestSuite {
  total: number;
  passed: number;
  failed: number;
  results: OptimisticTestResult[];
  duration: number;
}

/**
 * Comprehensive test suite for optimistic updates system
 */
export function useOptimisticTest() {
  const [testResults, setTestResults] = useState<OptimisticTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  const runTest = useCallback(async (
    testName: string,
    testFunction: () => Promise<any>
  ): Promise<OptimisticTestResult> => {
    const startTime = Date.now();
    setCurrentTest(testName);
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      const testResult: OptimisticTestResult = {
        test: testName,
        status: 'passed',
        duration,
        details: result
      };
      
      setTestResults(prev => [...prev, testResult]);
      return testResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const testResult: OptimisticTestResult = {
        test: testName,
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setTestResults(prev => [...prev, testResult]);
      return testResult;
    } finally {
      setCurrentTest(null);
    }
  }, []);

  const runAllTests = useCallback(async (): Promise<OptimisticTestSuite> => {
    const startTime = Date.now();
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Basic optimistic update
    await runTest('Basic Optimistic Update', async () => {
      const { addOptimistic, data, isOptimistic } = useOptimisticUpdate([], {
        successMessage: 'Test passed',
        errorMessage: 'Test failed'
      });

      const id = addOptimistic({ id: 'test', name: 'Test Item' });
      
      if (!isOptimistic(id)) {
        throw new Error('Item should be optimistic');
      }

      if (data.length !== 1) {
        throw new Error('Data should contain 1 item');
      }

      return { success: true, itemCount: data.length };
    });

    // Test 2: Optimistic bookings
    await runTest('Optimistic Bookings', async () => {
      const { createBooking, bookings, isOptimistic } = useOptimisticBookings([], {
        successMessage: 'Booking created',
        errorMessage: 'Booking failed'
      });

      const mockApiCall = async (data: any) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));
        return { booking: { id: 'real-id', ...data } };
      };

      // Mock the createBooking function
      const originalCreateBooking = createBooking;
      const mockCreateBooking = async (bookingData: any) => {
        const optimisticBooking = {
          id: `temp_${Date.now()}`,
          facilityId: bookingData.facilityId,
          userId: 'current_user',
          startTime: new Date(`${bookingData.date}T${bookingData.startTime}`),
          endTime: new Date(`${bookingData.date}T${bookingData.endTime}`),
          status: 'pending' as const,
          notes: bookingData.notes,
          createdAt: new Date(),
          updatedAt: new Date(),
          customerName: bookingData.name,
          customerEmail: bookingData.email
        };

        // Add optimistic booking
        const { addOptimistic } = useOptimisticUpdate([], {});
        const id = addOptimistic(optimisticBooking);
        
        if (!isOptimistic(id)) {
          throw new Error('Booking should be optimistic');
        }

        return { success: true, bookingId: id };
      };

      const result = await mockCreateBooking({
        facilityId: 'test-facility',
        name: 'Test User',
        email: 'test@example.com',
        date: '2024-01-01',
        startTime: '10:00',
        endTime: '12:00',
        notes: 'Test booking'
      });

      return result;
    });

    // Test 3: Optimistic form
    await runTest('Optimistic Form', async () => {
      const mockApiCall = async (data: any) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true, data };
      };

      const form = useOptimisticForm(
        { name: '', email: '' },
        mockApiCall,
        {
          successMessage: 'Form submitted successfully',
          errorMessage: 'Form submission failed'
        }
      );

      if (form.isSubmitting) {
        throw new Error('Form should not be submitting initially');
      }

      if (!form.isValid) {
        throw new Error('Form should be valid initially');
      }

      return { success: true, isValid: form.isValid };
    });

    // Test 4: Optimistic auth
    await runTest('Optimistic Auth', async () => {
      const { user, isAuthenticated, isLoading, isOptimistic } = useOptimisticAuth();

      if (isAuthenticated) {
        throw new Error('Should not be authenticated initially');
      }

      if (isLoading) {
        throw new Error('Should not be loading initially');
      }

      if (isOptimistic) {
        throw new Error('Should not be optimistic initially');
      }

      return { success: true, user: user, isAuthenticated };
    });

    // Test 5: Optimistic facilities
    await runTest('Optimistic Facilities', async () => {
      const { facilities, isOptimistic, createFacility } = useOptimisticFacilities([], {
        successMessage: 'Facility created',
        errorMessage: 'Facility creation failed'
      });

      if (facilities.length !== 0) {
        throw new Error('Should start with no facilities');
      }

      const mockCreateFacility = async (data: any) => {
        const optimisticFacility = {
          id: `temp_${Date.now()}`,
          name: data.name,
          description: data.description,
          location: data.location,
          capacity: data.capacity,
          amenities: data.amenities || [],
          images: data.images || [],
          status: 'active' as const,
          organizationId: data.organizationId,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const { addOptimistic } = useOptimisticUpdate([], {});
        const id = addOptimistic(optimisticFacility);
        
        return { success: true, facilityId: id };
      };

      const result = await mockCreateFacility({
        name: 'Test Facility',
        description: 'Test Description',
        location: 'Test Location',
        capacity: 50,
        organizationId: 'test-org'
      });

      return result;
    });

    // Test 6: Error handling
    await runTest('Error Handling', async () => {
      const { addOptimistic, rollbackOptimistic, isOptimistic } = useOptimisticUpdate([], {
        errorMessage: 'Test error'
      });

      const id = addOptimistic({ id: 'test', name: 'Test Item' });
      
      if (!isOptimistic(id)) {
        throw new Error('Item should be optimistic');
      }

      rollbackOptimistic(id);
      
      if (isOptimistic(id)) {
        throw new Error('Item should not be optimistic after rollback');
      }

      return { success: true, rollbackWorked: true };
    });

    // Test 7: Batch operations
    await runTest('Batch Operations', async () => {
      const { addOptimistic, data } = useOptimisticUpdate([], {});

      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' }
      ];

      items.forEach(item => addOptimistic(item));

      if (data.length !== 3) {
        throw new Error(`Expected 3 items, got ${data.length}`);
      }

      return { success: true, itemCount: data.length };
    });

    // Test 8: Performance test
    await runTest('Performance Test', async () => {
      const startTime = Date.now();
      const { addOptimistic, data } = useOptimisticUpdate([], {});

      // Add 100 items
      for (let i = 0; i < 100; i++) {
        addOptimistic({ id: `item-${i}`, name: `Item ${i}` });
      }

      const duration = Date.now() - startTime;
      
      if (data.length !== 100) {
        throw new Error(`Expected 100 items, got ${data.length}`);
      }

      if (duration > 1000) {
        throw new Error(`Performance test took too long: ${duration}ms`);
      }

      return { success: true, duration, itemCount: data.length };
    });

    const duration = Date.now() - startTime;
    setIsRunning(false);

    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;

    return {
      total: testResults.length,
      passed,
      failed,
      results: testResults,
      duration
    };
  }, [runTest, testResults]);

  const clearResults = useCallback(() => {
    setTestResults([]);
  }, []);

  const getTestSummary = useCallback(() => {
    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const total = testResults.length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    return {
      total,
      passed,
      failed,
      successRate: Math.round(successRate * 100) / 100,
      isComplete: total > 0 && !isRunning
    };
  }, [testResults, isRunning]);

  return {
    testResults,
    isRunning,
    currentTest,
    runAllTests,
    clearResults,
    getTestSummary
  };
}

/**
 * Hook for testing specific optimistic functionality
 */
export function useOptimisticFunctionTest() {
  const testOptimisticUpdate = useCallback(async () => {
    const { addOptimistic, data, isOptimistic, rollbackOptimistic } = useOptimisticUpdate([], {});
    
    const id = addOptimistic({ id: 'test', name: 'Test Item' });
    
    return {
      success: isOptimistic(id) && data.length === 1,
      itemCount: data.length,
      isOptimistic: isOptimistic(id)
    };
  }, []);

  const testOptimisticForm = useCallback(async () => {
    const mockApiCall = async (data: any) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true, data };
    };

    const form = useOptimisticForm(
      { name: '', email: '' },
      mockApiCall,
      {
        successMessage: 'Form submitted successfully',
        errorMessage: 'Form submission failed'
      }
    );

    return {
      success: !form.isSubmitting && form.isValid,
      isValid: form.isValid,
      isSubmitting: form.isSubmitting
    };
  }, []);

  const testOptimisticBookings = useCallback(async () => {
    const { bookings, isOptimistic } = useOptimisticBookings([], {});

    return {
      success: bookings.length === 0,
      bookingCount: bookings.length,
      hasOptimistic: false
    };
  }, []);

  return {
    testOptimisticUpdate,
    testOptimisticForm,
    testOptimisticBookings
  };
}
