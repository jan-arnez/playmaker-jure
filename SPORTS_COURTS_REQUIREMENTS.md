# Sports & Courts Component - Requirements

## Based on User Instructions:
"this part is quite important but isnt changed velikokrat, so we shall be smart here - we need sports which are created, could be multiple for some facilites. then we have edit court - where indoor outdoor surface type time slot, pricing and advanced pricing are defined. and active or unactive botton is shown."

## Current Implementation:
- Uses `SportsManagement` component with toggle to show/hide
- Shows overview of sports and courts
- Has full CRUD dialogs for sports and courts
- API endpoints: `/api/sport-categories`, `/api/courts`

## Required Features:

### 1. Sports Display
- Show all sports for the facility
- Each sport shows:
  - Name
  - Type (indoor/outdoor)
  - Number of courts
  - Active courts count
- Ability to:
  - Add new sport
  - Edit sport
  - Delete sport

### 2. Courts Display (under each sport)
- Show all courts for each sport
- Each court displays:
  - **Name**
  - **Location Type** (indoor/outdoor)
  - **Surface Type** (Hard Court, Clay Court, etc.)
  - **Time Slots** (30min, 45min, 60min, 90min, 120min)
  - **Pricing** (default price per hour)
  - **Advanced Pricing** (time-based pricing tiers)
  - **Active/Inactive** toggle (immediate action)
- Ability to:
  - Add new court
  - Edit court (all fields above)
  - Delete court
  - Toggle active/inactive status

### 3. Data Structure:
```typescript
interface SportCategory {
  id: string;
  name: string;
  description?: string;
  type: "indoor" | "outdoor";
  courts: Court[];
  createdAt: string;
  updatedAt: string;
}

interface Court {
  id: string;
  name: string;
  description?: string;
  surface?: string;
  capacity?: number;
  isActive: boolean;
  timeSlots: string[]; // ["30min", "45min", "60min", "90min", "120min"]
  locationType?: "indoor" | "outdoor";
  createdAt: string;
  updatedAt: string;
}
```

### 4. API Endpoints:
- POST `/api/sport-categories` - Create sport
- PUT `/api/sport-categories/[id]` - Update sport
- DELETE `/api/sport-categories/[id]` - Delete sport
- POST `/api/courts` - Create court
- PUT `/api/courts/[id]` - Update court
- DELETE `/api/courts/[id]` - Delete court

### 5. Design Requirements:
- Clean, organized layout
- Easy to scan and understand
- Quick actions (toggle active/inactive)
- Edit dialogs for detailed editing
- Show pricing information clearly
- Support for advanced pricing tiers

### 6. User Experience:
- Since this isn't changed often, make it clear and organized
- Show all important info at a glance
- Quick toggle for active/inactive
- Full editing via dialogs when needed

