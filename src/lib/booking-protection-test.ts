import { BookingValidator, AbuseDetector, ConflictResolver } from './booking-protection';
import { NextRequest } from 'next/server';

// Test suite for booking protection system
export class BookingProtectionTester {
  static async runAllTests(): Promise<{
    passed: number;
    failed: number;
    results: Array<{
      test: string;
      passed: boolean;
      error?: string;
    }>;
  }> {
    const results: Array<{
      test: string;
      passed: boolean;
      error?: string;
    }> = [];

    // Test 1: Valid booking validation
    try {
      const validResult = await BookingValidator.validateBooking({
        facilityId: 'test-facility-1',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
        email: 'test@example.com',
        name: 'Test User'
      });
      
      results.push({
        test: 'Valid booking validation',
        passed: validResult.isValid
      });
    } catch (error) {
      results.push({
        test: 'Valid booking validation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Invalid booking validation (past time)
    try {
      const invalidResult = await BookingValidator.validateBooking({
        facilityId: 'test-facility-1',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        email: 'test@example.com',
        name: 'Test User'
      });
      
      results.push({
        test: 'Invalid booking validation (past time)',
        passed: !invalidResult.isValid && invalidResult.errors.length > 0
      });
    } catch (error) {
      results.push({
        test: 'Invalid booking validation (past time)',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Abuse detection - rapid bookings
    try {
      const mockRequest = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0'
        }
      });

      const abuseResult = await AbuseDetector.detectAbuse(mockRequest, {
        email: 'test@example.com',
        name: 'Test User',
        facilityId: 'test-facility-1',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000)
      });
      
      results.push({
        test: 'Abuse detection - normal booking',
        passed: !abuseResult.isAbuse
      });
    } catch (error) {
      results.push({
        test: 'Abuse detection - normal booking',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Abuse detection - suspicious email
    try {
      const mockRequest = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0'
        }
      });

      const abuseResult = await AbuseDetector.detectAbuse(mockRequest, {
        email: 'test@test.com', // Suspicious email
        name: 'Test User',
        facilityId: 'test-facility-1',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000)
      });
      
      results.push({
        test: 'Abuse detection - suspicious email',
        passed: abuseResult.isAbuse && abuseResult.blocked
      });
    } catch (error) {
      results.push({
        test: 'Abuse detection - suspicious email',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 5: Conflict resolution
    try {
      const conflictResult = await ConflictResolver.resolveConflicts(
        'test-facility-1',
        new Date(Date.now() + 2 * 60 * 60 * 1000),
        new Date(Date.now() + 3 * 60 * 60 * 1000)
      );
      
      results.push({
        test: 'Conflict resolution',
        passed: typeof conflictResult.hasConflicts === 'boolean'
      });
    } catch (error) {
      results.push({
        test: 'Conflict resolution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 6: Email format validation
    try {
      const invalidEmailResult = await BookingValidator.validateBooking({
        facilityId: 'test-facility-1',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        email: 'invalid-email', // Invalid email format
        name: 'Test User'
      });
      
      results.push({
        test: 'Email format validation',
        passed: !invalidEmailResult.isValid && invalidEmailResult.errors.some(e => e.includes('email'))
      });
    } catch (error) {
      results.push({
        test: 'Email format validation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 7: Business hours validation
    try {
      const outsideHoursResult = await BookingValidator.validateBooking({
        facilityId: 'test-facility-1',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Tomorrow + 2 hours
        email: 'test@example.com',
        name: 'Test User'
      });
      
      // Set time to 3 AM (outside business hours)
      outsideHoursResult.startTime.setHours(3);
      outsideHoursResult.endTime.setHours(5);
      
      results.push({
        test: 'Business hours validation',
        passed: outsideHoursResult.warnings.some(w => w.includes('business hours'))
      });
    } catch (error) {
      results.push({
        test: 'Business hours validation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 8: Duration validation
    try {
      const shortDurationResult = await BookingValidator.validateBooking({
        facilityId: 'test-facility-1',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000), // 15 minutes
        email: 'test@example.com',
        name: 'Test User'
      });
      
      results.push({
        test: 'Duration validation (too short)',
        passed: !shortDurationResult.isValid && shortDurationResult.errors.some(e => e.includes('duration'))
      });
    } catch (error) {
      results.push({
        test: 'Duration validation (too short)',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 9: Name validation
    try {
      const invalidNameResult = await BookingValidator.validateBooking({
        facilityId: 'test-facility-1',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        email: 'test@example.com',
        name: 'A' // Too short
      });
      
      results.push({
        test: 'Name validation (too short)',
        passed: !invalidNameResult.isValid && invalidNameResult.errors.some(e => e.includes('Name'))
      });
    } catch (error) {
      results.push({
        test: 'Name validation (too short)',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 10: Suspicious name detection
    try {
      const mockRequest = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0'
        }
      });

      const suspiciousNameResult = await AbuseDetector.detectAbuse(mockRequest, {
        email: 'test@example.com',
        name: 'test', // Suspicious name
        facilityId: 'test-facility-1',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000)
      });
      
      results.push({
        test: 'Suspicious name detection',
        passed: suspiciousNameResult.isAbuse && suspiciousNameResult.reason.includes('name')
      });
    } catch (error) {
      results.push({
        test: 'Suspicious name detection',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    return { passed, failed, results };
  }

  static async testBookingFlow(): Promise<{
    success: boolean;
    steps: Array<{
      step: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const steps: Array<{
      step: string;
      success: boolean;
      error?: string;
    }> = [];

    // Step 1: Validate booking data
    try {
      const validation = await BookingValidator.validateBooking({
        facilityId: 'test-facility-1',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        email: 'test@example.com',
        name: 'Test User'
      });
      
      steps.push({
        step: 'Validate booking data',
        success: validation.isValid
      });
    } catch (error) {
      steps.push({
        step: 'Validate booking data',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Step 2: Check for conflicts
    try {
      const conflicts = await BookingValidator.checkConflicts({
        facilityId: 'test-facility-1',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000)
      });
      
      steps.push({
        step: 'Check for conflicts',
        success: true // This should always succeed, even if conflicts exist
      });
    } catch (error) {
      steps.push({
        step: 'Check for conflicts',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Step 3: Abuse detection
    try {
      const mockRequest = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0'
        }
      });

      const abuseDetection = await AbuseDetector.detectAbuse(mockRequest, {
        email: 'test@example.com',
        name: 'Test User',
        facilityId: 'test-facility-1',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000)
      });
      
      steps.push({
        step: 'Abuse detection',
        success: !abuseDetection.blocked
      });
    } catch (error) {
      steps.push({
        step: 'Abuse detection',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const success = steps.every(step => step.success);

    return { success, steps };
  }

  static async generateTestReport(): Promise<string> {
    const testResults = await this.runAllTests();
    const flowTest = await this.testBookingFlow();

    const report = `
# Booking Protection System Test Report

## Test Results Summary
- **Total Tests**: ${testResults.passed + testResults.failed}
- **Passed**: ${testResults.passed}
- **Failed**: ${testResults.failed}
- **Success Rate**: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%

## Individual Test Results
${testResults.results.map(result => `
### ${result.test}
- **Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}
${result.error ? `- **Error**: ${result.error}` : ''}
`).join('')}

## Booking Flow Test
- **Overall Success**: ${flowTest.success ? '✅ PASSED' : '❌ FAILED'}
- **Steps Completed**: ${flowTest.steps.filter(s => s.success).length}/${flowTest.steps.length}

### Flow Steps
${flowTest.steps.map(step => `
### ${step.step}
- **Status**: ${step.success ? '✅ PASSED' : '❌ FAILED'}
${step.error ? `- **Error**: ${step.error}` : ''}
`).join('')}

## Recommendations
${testResults.failed > 0 ? `
⚠️ **Action Required**: ${testResults.failed} test(s) failed. Please review and fix the issues.
` : `
✅ **All Tests Passed**: The booking protection system is working correctly.
`}

## Next Steps
1. Review any failed tests
2. Fix identified issues
3. Re-run tests to verify fixes
4. Deploy to production with confidence
`;

    return report;
  }
}

// Utility function to run tests from command line or admin panel
export async function runBookingProtectionTests(): Promise<void> {
  console.log('🧪 Running Booking Protection Tests...\n');
  
  const results = await BookingProtectionTester.runAllTests();
  const flowTest = await BookingProtectionTester.testBookingFlow();
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`);
  
  console.log('🔄 Booking Flow Test:');
  console.log(`Overall: ${flowTest.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Steps: ${flowTest.steps.filter(s => s.success).length}/${flowTest.steps.length}\n`);
  
  if (results.failed > 0) {
    console.log('❌ Failed Tests:');
    results.results
      .filter(r => !r.passed)
      .forEach(result => {
        console.log(`  - ${result.test}: ${result.error || 'Unknown error'}`);
      });
  }
  
  console.log('\n📋 Generating detailed report...');
  const report = await BookingProtectionTester.generateTestReport();
  console.log(report);
}
