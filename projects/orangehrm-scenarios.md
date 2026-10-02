# OrangeHRM Test Automation Project

## Project Overview
This document contains test automation scenarios for OrangeHRM (Human Resource Management System). Each scenario includes detailed steps, expected results, and automation assignments.

**Application URL:** https://opensource-demo.orangehrmlive.com/  
**Demo Credentials:**
- Username: Admin
- Password: admin123

---

## Module 1: Employee Management

### Scenario 1.1: Add New Employee
**Priority:** High  
**Module:** PIM (Personnel Information Management)

**Preconditions:**
- User is logged in as Admin
- Navigate to PIM > Add Employee

**Test Steps:**
1. Click on "PIM" menu
2. Click on "Add Employee" submenu
3. Enter First Name: "John"
4. Enter Middle Name: "Robert"
5. Enter Last Name: "Smith"
6. Enter Employee ID: "EMP001" (or auto-generated)
7. Take note of the Employee ID displayed
8. Click "Create Login Details" toggle (optional)
   - If creating login:
     - Enter Username: "johnsmith001"
     - Enter Password: "Test@1234"
     - Confirm Password: "Test@1234"
     - Select Status: "Enabled"
9. Upload employee photograph (optional)
10. Click "Save" button

**Expected Results:**
- Employee is successfully created
- Success message appears: "Successfully Saved"
- Employee details page is displayed
- Employee appears in Employee List

**Assignment Tasks:**
1. **Basic:** Automate the complete employee creation flow
2. **Intermediate:** Parameterize employee data using CSV/Excel file
3. **Advanced:** Create 10 employees with different data sets and verify all are created
4. **Expert:** Handle duplicate employee ID scenarios and validate error messages

**Validation Points:**
- Verify success message
- Verify employee appears in employee list
- Verify all entered data is saved correctly
- Verify employee ID uniqueness

---

### Scenario 1.2: Search Employee
**Priority:** High  
**Module:** PIM

**Preconditions:**
- At least one employee exists in the system
- User is logged in as Admin

**Test Steps:**
1. Navigate to PIM > Employee List
2. Enter Employee Name in search field: "John Smith"
3. Enter Employee ID: "EMP001"
4. Select Employment Status: "Full-Time" (if applicable)
5. Select Include: "Current Employees Only"
6. Select Supervisor Name (if applicable)
7. Select Job Title (if applicable)
8. Select Sub Unit (if applicable)
9. Click "Search" button

**Expected Results:**
- Search results display matching employees
- Employee "John Smith" appears in results
- All filter criteria are applied correctly
- Record count is displayed

**Assignment Tasks:**
1. **Basic:** Automate search by employee name
2. **Intermediate:** Automate search with multiple filter combinations
3. **Advanced:** Verify search results count matches actual records
4. **Expert:** Test partial name search and wildcard scenarios

---

### Scenario 1.3: Edit Employee Details
**Priority:** High  
**Module:** PIM

**Preconditions:**
- Employee "John Smith" exists
- User is logged in as Admin

**Test Steps:**
1. Navigate to PIM > Employee List
2. Search for employee "John Smith"
3. Click on the employee name in search results
4. Navigate to "Personal Details" section
5. Click "Edit" button
6. Update the following fields:
   - Driver's License Number: "DL123456789"
   - License Expiry Date: Select a future date
   - Nationality: Select "American"
   - Marital Status: Select "Single"
   - Date of Birth: "1990-01-15"
   - Gender: Select "Male"
7. Click "Save" button in Personal Details section
8. Navigate to "Contact Details" section
9. Click "Edit" button
10. Update contact information:
    - Street 1: "123 Main Street"
    - Street 2: "Apt 4B"
    - City: "New York"
    - State/Province: "NY"
    - Zip/Postal Code: "10001"
    - Country: "United States"
    - Home Telephone: "+1-555-0100"
    - Mobile: "+1-555-0101"
    - Work Email: "john.smith@example.com"
11. Click "Save" button

**Expected Results:**
- Success message appears after each save
- All updated information is displayed correctly
- Changes persist after logout/login

**Assignment Tasks:**
1. **Basic:** Automate editing personal details
2. **Intermediate:** Automate editing contact details and verify all fields
3. **Advanced:** Update multiple employees in a loop and verify changes
4. **Expert:** Test field validations (invalid dates, email formats, phone formats)

---

### Scenario 1.4: Delete Employee
**Priority:** Medium  
**Module:** PIM

**Preconditions:**
- Test employee exists in the system
- User is logged in as Admin

**Test Steps:**
1. Navigate to PIM > Employee List
2. Search for the employee to delete
3. Click the checkbox next to the employee record
4. Click "Delete Selected" button
5. Confirm deletion in the popup dialog
6. Click "Yes, Delete" button

**Expected Results:**
- Confirmation dialog appears
- Success message: "Successfully Deleted"
- Employee is removed from the list
- Record count decreases by 1

**Assignment Tasks:**
1. **Basic:** Automate single employee deletion
2. **Intermediate:** Automate deletion and verify employee no longer exists
3. **Advanced:** Delete multiple employees at once
4. **Expert:** Implement soft delete verification if applicable

---

## Module 2: Leave Management

### Scenario 2.1: Apply for Leave
**Priority:** High  
**Module:** Leave

**Preconditions:**
- User has an active employee account
- Leave types are configured
- Leave balance is available

**Test Steps:**
1. Login as employee (Username: Admin, Password: admin123)
2. Navigate to "Leave" menu
3. Click on "Apply" submenu
4. Select Leave Type: "CAN - Vacation"
5. Select From Date using date picker: Select a future date
6. Select To Date: Select date after From Date
7. Select Partial Days: "All Days" or specific option
8. Select Duration: "Full Day" or "Half Day"
9. Enter Comments: "Family vacation planned"
10. Click "Apply" button

**Expected Results:**
- Success message: "Successfully Saved"
- Leave request appears in "My Leave" list
- Leave status shows as "Pending Approval"
- Leave balance is updated (deducted from pending)
- Email notification sent (if configured)

**Assignment Tasks:**
1. **Basic:** Automate leave application for single day
2. **Intermediate:** Apply for multiple days and verify balance deduction
3. **Advanced:** Apply different types of leaves and verify workflows
4. **Expert:** Test date validations (past dates, weekends, holidays, overlapping leaves)

**Validation Points:**
- Verify success message
- Verify leave appears in "My Leave" list
- Verify leave status is "Pending Approval"
- Verify leave balance is updated correctly
- Verify dates are within allowed range

---

### Scenario 2.2: Approve/Reject Leave
**Priority:** High  
**Module:** Leave

**Preconditions:**
- Leave request exists in "Pending Approval" status
- User is logged in as Admin/Supervisor

**Test Steps:**
1. Navigate to Leave > Leave List
2. Click "Pending Approval" under Leave List
3. Locate the leave request to approve
4. Select the leave request checkbox
5. Click "Approve" button
6. Verify the confirmation dialog
7. Click "OK" to confirm

**For Rejection:**
1. Follow steps 1-3 above
2. Click "Reject" button
3. Enter rejection comments: "Not enough coverage"
4. Click "OK" to confirm

**Expected Results:**
- Leave status changes to "Approved" or "Rejected"
- Employee receives notification
- Leave balance updated for approved leaves
- Comments are saved for rejected leaves

**Assignment Tasks:**
1. **Basic:** Automate leave approval process
2. **Intermediate:** Automate leave rejection with comments
3. **Advanced:** Approve/reject multiple leaves in bulk
4. **Expert:** Verify leave balance calculations after approval/rejection

---

### Scenario 2.3: View Leave Balance
**Priority:** Medium  
**Module:** Leave

**Preconditions:**
- User is logged in
- Leave entitlements are configured

**Test Steps:**
1. Navigate to Leave > Entitlements
2. Click "My Entitlements"
3. Select Leave Period from dropdown
4. View leave balances for different leave types
5. Note the following for each leave type:
   - Leave Type
   - Entitled Days
   - Used Days
   - Scheduled Days
   - Pending Approval
   - Balance

**Expected Results:**
- All leave types are displayed
- Balances are calculated correctly
- Historical data is accessible

**Assignment Tasks:**
1. **Basic:** Extract and verify leave balance for one leave type
2. **Intermediate:** Extract all leave types and validate calculations
3. **Advanced:** Compare leave balance before and after leave application
4. **Expert:** Generate leave balance report and verify data accuracy

---

## Module 3: Time Management

### Scenario 3.1: Create Timesheet
**Priority:** High  
**Module:** Time

**Preconditions:**
- User is logged in as employee
- Projects and activities are configured

**Test Steps:**
1. Navigate to Time > Timesheets
2. Click "My Timesheets"
3. Click "Create Timesheet" button (if no current timesheet)
4. Select the week period from date picker
5. Click "Create" button
6. In the timesheet:
   - Select Project: Choose from dropdown
   - Select Activity: "Development" or other
   - Enter time for Monday: "08:00"
   - Enter time for Tuesday: "08:00"
   - Enter time for Wednesday: "08:00"
   - Enter time for Thursday: "08:00"
   - Enter time for Friday: "08:00"
   - Total should show: "40:00"
7. Click "Save" button
8. Click "Submit" button to submit for approval

**Expected Results:**
- Timesheet is created successfully
- Total hours are calculated correctly
- Timesheet status shows as "Submitted"
- Supervisor receives notification for approval

**Assignment Tasks:**
1. **Basic:** Create a timesheet with hours for one week
2. **Intermediate:** Create timesheets for multiple projects
3. **Advanced:** Verify total hours calculation for different time entries
4. **Expert:** Test validations (negative hours, excessive hours >24)

---

### Scenario 3.2: View Attendance Records
**Priority:** Medium  
**Module:** Time

**Test Steps:**
1. Navigate to Time > Attendance
2. Click "My Records"
3. Select Date Range: From and To dates
4. Click "View" button
5. Verify attendance records displayed

**Expected Results:**
- Attendance records for selected period are shown
- Punch In and Punch Out times are displayed
- Total duration is calculated

**Assignment Tasks:**
1. **Basic:** View attendance records for current month
2. **Intermediate:** Extract and validate attendance data
3. **Advanced:** Calculate total working hours from attendance records

---

## Module 4: Recruitment

### Scenario 4.1: Add Job Vacancy
**Priority:** High  
**Module:** Recruitment

**Preconditions:**
- User is logged in as Admin
- Job titles are configured

**Test Steps:**
1. Navigate to Recruitment > Vacancies
2. Click "Add" button
3. Enter Job Title: "Senior Software Engineer"
4. Select Job Title from dropdown: "Software Engineer"
5. Enter Description: "Looking for experienced developer"
6. Select Hiring Manager: Select from dropdown
7. Enter Number of Positions: "2"
8. Click "Active" checkbox
9. Click "Publish in RSS feed and web page" (optional)
10. Click "Save" button

**Expected Results:**
- Vacancy is created successfully
- Success message appears
- Vacancy appears in vacancies list
- Vacancy is published if option selected

**Assignment Tasks:**
1. **Basic:** Automate vacancy creation
2. **Intermediate:** Create multiple vacancies with different data
3. **Advanced:** Verify vacancy appears in public career page
4. **Expert:** Edit and update vacancy details

---

### Scenario 4.2: Add Candidate
**Priority:** High  
**Module:** Recruitment

**Preconditions:**
- At least one active vacancy exists
- User is logged in as Admin

**Test Steps:**
1. Navigate to Recruitment > Candidates
2. Click "Add" button
3. Enter First Name: "Jane"
4. Enter Middle Name: "Marie"
5. Enter Last Name: "Doe"
6. Select Vacancy: "Senior Software Engineer"
7. Enter Email: "jane.doe@example.com"
8. Enter Contact Number: "+1-555-0200"
9. Upload Resume (optional)
10. Enter Keywords: "Java, Python, AWS"
11. Enter Date of Application: Select current date
12. Add Notes: "Strong technical background"
13. Click "Save" button

**Expected Results:**
- Candidate is added successfully
- Candidate appears in candidates list
- Candidate status is "Application Initiated"
- Resume is uploaded if provided

**Assignment Tasks:**
1. **Basic:** Add a single candidate
2. **Intermediate:** Add multiple candidates for different vacancies
3. **Advanced:** Upload resume and verify file upload
4. **Expert:** Verify candidate email uniqueness validation

---

### Scenario 4.3: Process Candidate Application
**Priority:** High  
**Module:** Recruitment

**Preconditions:**
- Candidate exists in the system
- User is logged in as Admin

**Test Steps:**
1. Navigate to Recruitment > Candidates
2. Search and select candidate "Jane Doe"
3. Click on candidate name
4. Click "Shortlist" button
5. Enter notes: "Qualified for interview"
6. Click "Save" button
7. Verify status changed to "Shortlisted"
8. Click "Schedule Interview" button
9. Enter Interview Title: "Technical Round 1"
10. Select Interviewer: Choose from list
11. Select Interview Date and Time
12. Click "Save" button
13. After interview, click "Mark Interview Passed"
14. Enter notes: "Good technical skills"
15. Click "Save"

**Expected Results:**
- Candidate status updates at each stage
- Interview is scheduled successfully
- Notifications sent to interviewer
- Status progression is tracked

**Assignment Tasks:**
1. **Basic:** Move candidate through shortlist status
2. **Intermediate:** Schedule interview and verify
3. **Advanced:** Complete full recruitment workflow (shortlist → interview → offer → hire)
4. **Expert:** Reject candidate and verify status change

---

## Module 5: Performance Management

### Scenario 5.1: Configure KPI (Key Performance Indicators)
**Priority:** Medium  
**Module:** Performance

**Preconditions:**
- User is logged in as Admin
- Job titles exist

**Test Steps:**
1. Navigate to Performance > Configure > KPIs
2. Click "Add" button
3. Enter Key Performance Indicator: "Code Quality"
4. Select Job Title: "Software Engineer"
5. Enter Min Rating: "0"
6. Enter Max Rating: "100"
7. Select "Make Default Scale" (optional)
8. Click "Save" button

**Expected Results:**
- KPI is created successfully
- KPI appears in KPI list
- Can be used in performance reviews

**Assignment Tasks:**
1. **Basic:** Create a single KPI
2. **Intermediate:** Create multiple KPIs for different job titles
3. **Advanced:** Edit and update existing KPI

---

### Scenario 5.2: Create Performance Review
**Priority:** High  
**Module:** Performance

**Preconditions:**
- Employees exist
- KPIs are configured
- User is logged in as Admin

**Test Steps:**
1. Navigate to Performance > Manage Reviews
2. Click "Add" button
3. Enter Review Period Start Date
4. Enter Review Period End Date
5. Enter Due Date
6. Select Employee: "John Smith"
7. Select Reviewer: Select supervisor
8. Add KPIs to review
9. Click "Save" button
10. Activate the review

**Expected Results:**
- Performance review is created
- Employee and reviewer receive notifications
- Review appears in pending reviews list

**Assignment Tasks:**
1. **Basic:** Create a performance review
2. **Intermediate:** Add multiple KPIs to review
3. **Advanced:** Complete review process with ratings

---

## Module 6: Reports

### Scenario 6.1: Generate Employee Report
**Priority:** Medium  
**Module:** PIM Reports

**Test Steps:**
1. Navigate to PIM > Reports
2. Click on predefined report or "Add" for custom report
3. Enter Report Name: "Employee Demographics Report"
4. Select Selection Criteria:
   - Include: Personal, Contact Details, Employment
5. Select Display Fields:
   - Employee Name
   - Employee ID
   - Job Title
   - Department
   - Email
   - Contact Number
6. Click "Search" or "Generate" button

**Expected Results:**
- Report is generated successfully
- All selected fields are displayed
- Data is accurate
- Report can be exported (CSV/PDF)

**Assignment Tasks:**
1. **Basic:** Generate a predefined report
2. **Intermediate:** Create custom report with specific fields
3. **Advanced:** Export report and validate exported data
4. **Expert:** Verify report data matches database records

---

## Module 7: Admin Functions

### Scenario 7.1: Create User Account
**Priority:** High  
**Module:** Admin

**Preconditions:**
- User is logged in as Admin
- Employee exists (to link user account)

**Test Steps:**
1. Navigate to Admin > User Management > Users
2. Click "Add" button
3. Select User Role: "ESS" (Employee Self Service)
4. Select Employee Name: "John Smith"
5. Enter Username: "john.smith"
6. Select Status: "Enabled"
7. Enter Password: "Test@1234"
8. Confirm Password: "Test@1234"
9. Click "Save" button

**Expected Results:**
- User account created successfully
- Success message appears
- User can login with credentials
- User has appropriate role permissions

**Assignment Tasks:**
1. **Basic:** Create a user account with ESS role
2. **Intermediate:** Create users with different roles (Admin, ESS, Supervisor)
3. **Advanced:** Verify role-based access control
4. **Expert:** Test password policy validations

---

### Scenario 7.2: Add Job Title
**Priority:** Medium  
**Module:** Admin

**Test Steps:**
1. Navigate to Admin > Job > Job Titles
2. Click "Add" button
3. Enter Job Title: "QA Automation Engineer"
4. Enter Job Description: "Responsible for test automation"
5. Upload Job Specification file (optional)
6. Enter Note: "Technical role"
7. Click "Save" button

**Expected Results:**
- Job title is created
- Appears in job titles list
- Available in employee assignment dropdown

**Assignment Tasks:**
1. **Basic:** Add a job title
2. **Intermediate:** Add multiple job titles and verify
3. **Advanced:** Upload job specification and verify file upload

---

### Scenario 7.3: Configure Organization Structure
**Priority:** Medium  
**Module:** Admin

**Test Steps:**
1. Navigate to Admin > Organization > General Information
2. Enter/Update Organization Name
3. Enter Registration Number
4. Enter Tax ID
5. Enter Phone
6. Enter Fax
7. Enter Email
8. Enter Address
9. Click "Save" button

**Expected Results:**
- Organization information is saved
- Information displays in organization structure
- Used in reports and documents

**Assignment Tasks:**
1. **Basic:** Update organization information
2. **Intermediate:** Verify updated information in generated reports

---

## Integration Scenarios

### Scenario 8.1: End-to-End Employee Lifecycle
**Priority:** High  
**Modules:** PIM, Admin, Leave, Time, Performance

**Complete Workflow:**
1. Create employee account
2. Create user login
3. Assign to job title and department
4. Apply for leave as employee
5. Approve leave as supervisor
6. Create timesheet
7. Submit timesheet for approval
8. Create performance review
9. Complete performance review
10. Generate employee report

**Assignment Tasks:**
1. **Expert Level:** Automate complete employee lifecycle
2. Verify data consistency across modules
3. Generate comprehensive test report

---

## Assignments Summary

### Assignment 1: Basic CRUD Operations (Beginner)
**Estimated Time:** 8 hours  
**Modules:** PIM, Admin

**Tasks:**
1. Automate employee creation (Scenario 1.1)
2. Automate employee search (Scenario 1.2)
3. Automate employee edit (Scenario 1.3)
4. Automate employee deletion (Scenario 1.4)

**Deliverables:**
- Working test scripts for all CRUD operations
- Test execution report
- Screenshots of test execution

---

### Assignment 2: Leave Management Automation (Intermediate)
**Estimated Time:** 12 hours  
**Modules:** Leave

**Tasks:**
1. Automate leave application (Scenario 2.1)
2. Automate leave approval (Scenario 2.2)
3. Verify leave balance calculations (Scenario 2.3)
4. Test leave validations (overlapping dates, insufficient balance)

**Deliverables:**
- Test automation framework for leave module
- Data-driven test cases with multiple leave types
- Leave balance verification report

---

### Assignment 3: Recruitment Workflow (Intermediate)
**Estimated Time:** 10 hours  
**Modules:** Recruitment

**Tasks:**
1. Create job vacancy (Scenario 4.1)
2. Add candidates (Scenario 4.2)
3. Process candidate application (Scenario 4.3)
4. Complete hiring workflow

**Deliverables:**
- End-to-end recruitment automation
- Candidate tracking report
- Test data management strategy

---

### Assignment 4: Complete Module Integration (Advanced)
**Estimated Time:** 20 hours  
**Modules:** All

**Tasks:**
1. Implement Page Object Model design pattern
2. Automate complete employee lifecycle (Scenario 8.1)
3. Implement data-driven testing using external data sources
4. Generate comprehensive HTML/Allure reports
5. Implement parallel test execution
6. Add API testing for available endpoints

**Deliverables:**
- Complete test automation framework
- API and UI test integration
- CI/CD pipeline configuration
- Comprehensive test documentation
- Code coverage report

---

## Test Data

### Sample Employee Data
```csv
FirstName,MiddleName,LastName,EmployeeID,Username,Password
John,Robert,Smith,EMP001,john.smith,Test@1234
Jane,Marie,Doe,EMP002,jane.doe,Test@1234
Michael,James,Brown,EMP003,michael.brown,Test@1234
Sarah,Ann,Davis,EMP004,sarah.davis,Test@1234
```

### Sample Leave Types
- CAN - Vacation
- CAN - Personal
- CAN - Sick
- US - Vacation
- US - Personal

### Sample Job Titles
- Software Engineer
- Senior Software Engineer
- QA Engineer
- Project Manager
- HR Manager

---

## Locator Strategy Tips

### Common Element Locators
- Login Username: `name="username"`
- Login Password: `name="password"`
- Login Button: `xpath=//button[@type='submit']`
- Menu Items: `xpath=//span[text()='MenuName']`
- Add Button: `xpath=//button[normalize-space()='Add']`
- Save Button: `xpath=//button[@type='submit' and normalize-space()='Save']`
- Success Message: `class="oxd-toast oxd-toast--success"`

### Best Practices
1. Use ID when available
2. Use data-* attributes if present
3. Use CSS selectors for performance
4. Avoid XPath with absolute paths
5. Use text() for dynamic elements
6. Implement explicit waits for dynamic content

---

## API Testing (Bonus)

OrangeHRM provides REST API endpoints. Document and test:
- Employee CRUD operations via API
- Leave application via API
- Authentication endpoint
- Compare UI vs API response data

---

## Performance Testing Scenarios

1. Login performance with multiple concurrent users
2. Employee list loading time with 1000+ records
3. Report generation performance
4. Search functionality response time

---

## Reporting Requirements

Each assignment should include:
1. Test execution summary (Pass/Fail count)
2. Execution time
3. Screenshots of failures
4. Detailed logs
5. Code coverage metrics
6. Defect report (if any bugs found)

---

## Evaluation Criteria

1. **Code Quality (25%)**
   - Clean code principles
   - Proper naming conventions
   - Code comments
   - Design patterns used

2. **Test Coverage (25%)**
   - Scenario coverage
   - Validation points covered
   - Edge cases handled

3. **Framework Design (20%)**
   - Modularity
   - Reusability
   - Maintainability
   - Scalability

4. **Reporting (15%)**
   - Clear test reports
   - Proper documentation
   - Screenshots/videos

5. **Best Practices (15%)**
   - Exception handling
   - Wait strategies
   - Data management
   - Version control

---

**Good Luck with Your Test Automation Journey! 🚀**
