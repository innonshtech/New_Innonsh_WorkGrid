const fs = require('fs');

const appendText = `
// Holiday Models
model HolidayList {
  id                  String    @id @default(uuid())
  mongoId             String?   @unique
  organizationId      String?
  name                String
  year                Int
  isDefault           Boolean   @default(false)
  applicableLocations Json?
  status              String    @default("Active")
  holidayListData     Json?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

model Holiday {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  holidayListId   String?
  organizationId  String?
  name            String
  date            DateTime
  isRestricted    Boolean   @default(false)
  status          String    @default("Active")
  holidayData     Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model RestrictedHolidayClaim {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  employeeId      String?
  holidayId       String?
  year            Int
  status          String    @default("Pending")
  claimData       Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
`;

fs.appendFileSync('prisma/schema.prisma', appendText);
console.log("Appended Holiday models to schema.prisma");
