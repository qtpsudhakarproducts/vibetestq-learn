# SuiteCRM Test Automation Project

## Project Overview
This document contains test automation scenarios for SuiteCRM (Customer Relationship Management System). Each scenario includes detailed steps, expected results, and automation assignments.

**Application URL:** https://suitecrm.com/demo/  
**Demo Access:** Request demo access or use public demo instance  
**Note:** Demo credentials may vary - check the SuiteCRM demo page for current login details

---

## Module 1: Accounts Management

### Scenario 1.1: Create New Account
**Priority:** High  
**Module:** Accounts

**Preconditions:**
- User is logged in to SuiteCRM
- User has permission to create accounts

**Test Steps:**
1. Click on "Accounts" tab in the main navigation
2. Click "Create Account" button
3. Enter Account Name: "Acme Corporation"
4. Enter Phone: "+1-555-0100"
5. Enter Website: "www.acmecorp.com"
6. Select Account Type: "Customer"
7. Select Industry: "Technology"
8. Enter Annual Revenue: "5000000"
9. Enter Employees: "250"
10. Enter Billing Address:
    - Street: "100 Tech Parkway"
    - City: "San Francisco"
    - State: "CA"
    - Postal Code: "94105"
    - Country: "USA"
11. Copy Billing Address to Shipping Address
12. Enter Description: "Leading technology solutions provider"
13. Select Assigned To: Current user
14. Click "Save" button

**Expected Results:**
- Account is created successfully
- Success message appears
- Account details page is displayed
- Account appears in Accounts list view
- All entered data is saved correctly

**Assignment Tasks:**
1. **Basic:** Automate account creation with mandatory fields
2. **Intermediate:** Automate with all fields and verify data persistence
3. **Advanced:** Create multiple accounts using data-driven approach
4. **Expert:** Validate duplicate account detection and field validations

**Validation Points:**
- Verify success notification
- Verify account name is displayed
- Verify all fields are populated correctly
- Verify account appears in recently created list

---

### Scenario 1.2: Search and Filter Accounts
**Priority:** High  
**Module:** Accounts

**Preconditions:**
- Multiple accounts exist in the system
- User is logged in

**Test Steps:**
1. Navigate to Accounts module
2. Use Basic Search:
   - Enter search term: "Acme"
   - Click "Search" button
3. Verify results displayed
4. Clear search results
5. Use Advanced Search:
   - Click "Advanced Search" icon/button
   - Enter Account Name: "Acme Corporation"
   - Select Account Type: "Customer"
   - Select Industry: "Technology"
   - Enter Annual Revenue range: Min: 1000000, Max: 10000000
   - Click "Search" button
6. Apply filters:
   - My Accounts
   - All Accounts
   - Recently Created
   - Recently Modified

**Expected Results:**
- Basic search returns matching accounts
- Advanced search applies all criteria correctly
- Filters work as expected
- Search results can be cleared
- Result count is accurate

**Assignment Tasks:**
1. **Basic:** Automate basic search functionality
2. **Intermediate:** Implement advanced search with multiple criteria
3. **Advanced:** Test all filter combinations
4. **Expert:** Validate search performance and result accuracy

---

### Scenario 1.3: Edit Account Details
**Priority:** High  
**Module:** Accounts

**Preconditions:**
- Account "Acme Corporation" exists
- User has edit permissions

**Test Steps:**
1. Navigate to Accounts module
2. Search for "Acme Corporation"
3. Click on account name to open detail view
4. Click "Edit" button
5. Update the following fields:
   - Phone: "+1-555-0150"
   - Website: "www.acmecorp.com/newsite"
   - Annual Revenue: "7500000"
   - Employees: "300"
   - Description: "Updated: Leading technology solutions provider with global presence"
6. Update Billing Address:
   - Street: "200 Tech Parkway"
7. Click "Save" button

**Expected Results:**
- Changes are saved successfully
- Updated data is displayed in detail view
- Modified timestamp is updated
- Edit history is tracked

**Assignment Tasks:**
1. **Basic:** Edit and save account details
2. **Intermediate:** Verify all field updates are persisted
3. **Advanced:** Test concurrent edit scenarios
4. **Expert:** Validate audit trail and change history

---

### Scenario 1.4: Delete Account
**Priority:** Medium  
**Module:** Accounts

**Preconditions:**
- Test account exists
- User has delete permissions

**Test Steps:**
1. Navigate to Accounts module
2. Search for test account
3. Select account checkbox
4. Click "Delete" button from actions dropdown
5. Confirm deletion in popup dialog
6. Click "OK" or "Confirm"

**Expected Results:**
- Confirmation dialog appears
- Account is deleted successfully
- Success message appears
- Account is removed from list view
- Account count decreases

**Assignment Tasks:**
1. **Basic:** Automate account deletion
2. **Intermediate:** Verify account is no longer accessible
3. **Advanced:** Test bulk delete functionality
4. **Expert:** Validate deletion of accounts with related records

---

## Module 2: Contacts Management

### Scenario 2.1: Create New Contact
**Priority:** High  
**Module:** Contacts

**Preconditions:**
- User is logged in
- At least one account exists to link contact

**Test Steps:**
1. Click on "Contacts" tab
2. Click "Create Contact" button
3. Select Salutation: "Mr."
4. Enter First Name: "John"
5. Enter Last Name: "Doe"
6. Enter Title: "VP of Sales"
7. Select Account Name: "Acme Corporation"
8. Enter Office Phone: "+1-555-0200"
9. Enter Mobile: "+1-555-0201"
10. Enter Email: "john.doe@acmecorp.com"
11. Select Reports To: (if applicable)
12. Enter Primary Address:
    - Street: "200 Tech Parkway"
    - City: "San Francisco"
    - State: "CA"
    - Postal Code: "94105"
    - Country: "USA"
13. Enter Description: "Key decision maker for technology purchases"
14. Select Assigned To: Current user
15. Click "Save" button

**Expected Results:**
- Contact is created successfully
- Contact is linked to account
- Contact appears in account's contacts subpanel
- All entered data is saved
- Email is validated

**Assignment Tasks:**
1. **Basic:** Create contact with mandatory fields
2. **Intermediate:** Create contact and verify account relationship
3. **Advanced:** Create multiple contacts for same account
4. **Expert:** Test email validation and duplicate contact detection

**Validation Points:**
- Verify contact-account relationship
- Verify email format validation
- Verify contact appears in recently created
- Verify full name concatenation (Salutation + First + Last)

---

### Scenario 2.2: Link Contact to Multiple Accounts
**Priority:** Medium  
**Module:** Contacts

**Preconditions:**
- Contact exists
- Multiple accounts exist

**Test Steps:**
1. Navigate to contact detail view
2. Scroll to "Accounts" subpanel
3. Click "Select" or "Add" button
4. Search and select additional account
5. Click "Save" or "Link"
6. Verify account appears in subpanel
7. Repeat for additional accounts

**Expected Results:**
- Contact can be linked to multiple accounts
- All linked accounts appear in subpanel
- Relationships are saved correctly

**Assignment Tasks:**
1. **Basic:** Link contact to one additional account
2. **Intermediate:** Link contact to multiple accounts
3. **Advanced:** Verify bidirectional relationships
4. **Expert:** Test unlinking and relinking scenarios

---

### Scenario 2.3: Convert Contact to Lead (if applicable)
**Priority:** Low  
**Module:** Contacts

**Test Steps:**
1. Open contact detail view
2. Click "More" or "Actions" dropdown
3. Select "Convert to Lead" (if available)
4. Fill in lead-specific information
5. Click "Save"

**Expected Results:**
- Contact is converted to lead
- Lead record is created
- Original contact is retained or merged

**Assignment Tasks:**
1. **Intermediate:** Automate contact to lead conversion
2. **Advanced:** Verify data migration to lead record

---

## Module 3: Leads Management

### Scenario 3.1: Create New Lead
**Priority:** High  
**Module:** Leads

**Preconditions:**
- User is logged in
- User has permission to create leads

**Test Steps:**
1. Click on "Leads" tab
2. Click "Create Lead" button
3. Select Salutation: "Ms."
4. Enter First Name: "Sarah"
5. Enter Last Name: "Johnson"
6. Enter Title: "IT Director"
7. Enter Account Name: "Tech Innovations Inc"
8. Enter Phone: "+1-555-0300"
9. Enter Mobile: "+1-555-0301"
10. Enter Email: "sarah.johnson@techinnovations.com"
11. Select Lead Source: "Web Site"
12. Select Status: "New"
13. Enter Department: "Information Technology"
14. Enter Primary Address
15. Enter Description: "Interested in enterprise software solutions"
16. Select Assigned To: Current user
17. Click "Save" button

**Expected Results:**
- Lead is created successfully
- Lead status is "New"
- Lead appears in leads list
- All data is saved correctly

**Assignment Tasks:**
1. **Basic:** Create lead with mandatory fields
2. **Intermediate:** Create leads from different sources
3. **Advanced:** Create multiple leads using test data file
4. **Expert:** Validate lead source tracking and status workflow

---

### Scenario 3.2: Qualify/Disqualify Lead
**Priority:** High  
**Module:** Leads

**Preconditions:**
- Lead exists in "New" or "Contacted" status
- User has permission to update leads

**Test Steps:**
1. Navigate to Leads module
2. Open lead "Sarah Johnson"
3. Click "Edit" button
4. Update Status: "Qualified" or "Unqualified"
5. If Qualified:
   - Enter qualification notes
   - Update opportunity information
6. If Unqualified:
   - Select reason for disqualification
   - Enter notes
7. Click "Save" button

**Expected Results:**
- Lead status is updated
- Notes are saved
- Lead appears in appropriate filtered views
- Timestamp is updated

**Assignment Tasks:**
1. **Basic:** Update lead status
2. **Intermediate:** Qualify lead and verify workflow
3. **Advanced:** Test multiple status transitions
4. **Expert:** Validate business rules for status changes

---

### Scenario 3.3: Convert Lead to Opportunity
**Priority:** High  
**Module:** Leads, Opportunities

**Preconditions:**
- Qualified lead exists
- User has permissions to convert leads

**Test Steps:**
1. Open qualified lead detail view
2. Click "Convert Lead" button
3. In conversion wizard:
   - Select "Create Account" or link to existing
   - Select "Create Contact" 
   - Select "Create Opportunity"
4. Enter Opportunity details:
   - Opportunity Name: "Tech Innovations - Enterprise Software"
   - Amount: "150000"
   - Close Date: Select future date
   - Sales Stage: "Prospecting"
5. Review conversion summary
6. Click "Convert" or "Save" button

**Expected Results:**
- Account is created (or linked)
- Contact is created from lead
- Opportunity is created
- Lead status changes to "Converted"
- All relationships are established
- Data is transferred correctly

**Assignment Tasks:**
1. **Basic:** Convert lead to opportunity
2. **Intermediate:** Verify all related records are created
3. **Advanced:** Test conversion with existing account
4. **Expert:** Validate data mapping and relationship integrity

---

## Module 4: Opportunities Management

### Scenario 4.1: Create New Opportunity
**Priority:** High  
**Module:** Opportunities

**Preconditions:**
- User is logged in
- Account and contact exist

**Test Steps:**
1. Click on "Opportunities" tab
2. Click "Create Opportunity" button
3. Enter Opportunity Name: "Acme Corp - Cloud Migration"
4. Select Account: "Acme Corporation"
5. Enter Amount: "250000"
6. Select Currency: "USD"
7. Select Expected Close Date: Future date (e.g., 90 days from now)
8. Select Sales Stage: "Prospecting"
9. Select Probability: Auto-filled based on stage
10. Select Lead Source: "Existing Customer"
11. Select Type: "New Business"
12. Enter Description: "Cloud infrastructure migration project"
13. Select Assigned To: Current user
14. Click "Save" button

**Expected Results:**
- Opportunity is created
- Linked to account
- Sales stage workflow is initiated
- Probability is calculated
- Appears in pipeline

**Assignment Tasks:**
1. **Basic:** Create opportunity with required fields
2. **Intermediate:** Create and link to account/contact
3. **Advanced:** Create opportunities in different stages
4. **Expert:** Validate probability calculation and stage progression

**Validation Points:**
- Verify account relationship
- Verify amount and currency
- Verify close date is in future
- Verify probability matches sales stage

---

### Scenario 4.2: Update Opportunity Stage
**Priority:** High  
**Module:** Opportunities

**Preconditions:**
- Opportunity exists
- User has update permissions

**Test Steps:**
1. Open opportunity detail view
2. Click "Edit" button
3. Update Sales Stage from "Prospecting" to "Qualification"
4. Update Probability (auto-updates or manual)
5. Add notes about stage change
6. Update Expected Close Date if needed
7. Click "Save" button
8. Repeat for other stages:
   - Needs Analysis
   - Value Proposition
   - Negotiation/Review
   - Closed Won/Closed Lost

**Expected Results:**
- Sales stage is updated
- Probability changes accordingly
- History is tracked
- Pipeline view reflects changes
- Notifications sent (if configured)

**Assignment Tasks:**
1. **Basic:** Update opportunity stage
2. **Intermediate:** Progress opportunity through full sales cycle
3. **Advanced:** Test stage validation rules
4. **Expert:** Verify pipeline and forecast calculations

---

### Scenario 4.3: Add Products to Opportunity (if module enabled)
**Priority:** Medium  
**Module:** Opportunities, Products

**Test Steps:**
1. Open opportunity detail view
2. Navigate to "Products" or "Line Items" subpanel
3. Click "Add Product" or "Select Product"
4. Search and select products
5. Enter quantity for each product
6. Verify pricing calculation
7. Apply discount if applicable
8. Click "Save"

**Expected Results:**
- Products are added to opportunity
- Total amount is calculated
- Quantity and pricing are correct
- Discounts are applied

**Assignment Tasks:**
1. **Basic:** Add single product to opportunity
2. **Intermediate:** Add multiple products and verify total
3. **Advanced:** Test discount calculations

---

### Scenario 4.4: Close Opportunity (Won/Lost)
**Priority:** High  
**Module:** Opportunities

**Preconditions:**
- Opportunity is in final negotiation stage
- Decision has been made

**Test Steps:**
1. Open opportunity detail view
2. Click "Edit" button
3. Update Sales Stage: "Closed Won" or "Closed Lost"
4. If Closed Won:
   - Verify amount is final
   - Enter actual close date
   - Add success notes
5. If Closed Lost:
   - Select loss reason
   - Enter competitor information (if applicable)
   - Add notes explaining loss
6. Click "Save" button

**Expected Results:**
- Opportunity is marked as closed
- Revenue is recognized (if won)
- Loss reason is recorded (if lost)
- Appears in appropriate reports
- Pipeline is updated

**Assignment Tasks:**
1. **Basic:** Close opportunity as won/lost
2. **Intermediate:** Verify reporting and analytics update
3. **Advanced:** Test revenue recognition
4. **Expert:** Validate forecast accuracy

---

## Module 5: Cases (Customer Support)

### Scenario 5.1: Create New Case
**Priority:** High  
**Module:** Cases

**Preconditions:**
- User is logged in
- Customer account/contact exists

**Test Steps:**
1. Click on "Cases" tab
2. Click "Create Case" button
3. Enter Case Number: Auto-generated or manual
4. Enter Subject: "Software installation issue"
5. Select Account: "Acme Corporation"
6. Select Contact: "John Doe"
7. Select Priority: "High"
8. Select Status: "New"
9. Select Type: "Technical"
10. Enter Description: "Customer unable to install software on Windows 11"
11. Select Assigned To: Support team member
12. Click "Save" button

**Expected Results:**
- Case is created successfully
- Case number is assigned
- Customer is notified (if auto-response enabled)
- Case appears in assigned user's queue
- SLA timer starts (if configured)

**Assignment Tasks:**
1. **Basic:** Create case with basic details
2. **Intermediate:** Create cases with different priorities
3. **Advanced:** Verify SLA tracking
4. **Expert:** Test escalation rules

**Validation Points:**
- Verify case number format
- Verify customer linkage
- Verify priority-based routing
- Verify auto-assignment rules

---

### Scenario 5.2: Update Case Status
**Priority:** High  
**Module:** Cases

**Preconditions:**
- Case exists in "New" status
- User is assigned to case

**Test Steps:**
1. Open case detail view
2. Click "Edit" button
3. Update Status: "Assigned" → "In Progress" → "Pending Input" → "Resolved"
4. Add case update notes for each status change
5. Update resolution details when resolving
6. Enter time spent (if time tracking enabled)
7. Click "Save" button

**Expected Results:**
- Status is updated
- History is maintained
- Customer is notified of updates
- SLA compliance is tracked

**Assignment Tasks:**
1. **Basic:** Update case status
2. **Intermediate:** Complete full case lifecycle
3. **Advanced:** Test status workflow validations
4. **Expert:** Verify SLA breach handling

---

### Scenario 5.3: Add Notes and Attachments to Case
**Priority:** Medium  
**Module:** Cases

**Test Steps:**
1. Open case detail view
2. Navigate to "Notes" section
3. Click "Create Note"
4. Enter subject and description
5. Attach file (screenshot, log file, etc.)
6. Click "Save"
7. Verify note and attachment appear in case history

**Expected Results:**
- Note is added successfully
- File is attached
- Timestamp is recorded
- Accessible to assigned users

**Assignment Tasks:**
1. **Basic:** Add note to case
2. **Intermediate:** Attach multiple files
3. **Advanced:** Test file type restrictions

---

## Module 6: Campaigns (Marketing)

### Scenario 6.1: Create Marketing Campaign
**Priority:** High  
**Module:** Campaigns

**Preconditions:**
- User has marketing permissions
- Target list exists (optional)

**Test Steps:**
1. Navigate to Campaigns module
2. Click "Create Campaign"
3. Enter Campaign Name: "Q1 2026 Product Launch"
4. Select Campaign Type: "Email"
5. Select Status: "Planning"
6. Enter Start Date: Current date
7. Enter End Date: Future date
8. Enter Budget: "50000"
9. Enter Expected Revenue: "500000"
10. Enter Description: "Launch campaign for new product line"
11. Select Assigned To: Marketing team
12. Click "Save" button

**Expected Results:**
- Campaign is created
- Status is set correctly
- Budget tracking is enabled
- Campaign appears in list view

**Assignment Tasks:**
1. **Basic:** Create email campaign
2. **Intermediate:** Create campaigns of different types
3. **Advanced:** Link target lists to campaigns
4. **Expert:** Track campaign ROI

---

### Scenario 6.2: Create and Manage Target Lists
**Priority:** Medium  
**Module:** Target Lists

**Test Steps:**
1. Navigate to Target Lists
2. Click "Create Target List"
3. Enter Name: "Enterprise Customers"
4. Select Type: "Default"
5. Enter Description
6. Click "Save"
7. Add targets (Contacts/Leads):
   - Click "Select" in Contacts subpanel
   - Search and select contacts
   - Click "Save"

**Expected Results:**
- Target list is created
- Contacts/leads are added
- List can be used in campaigns

**Assignment Tasks:**
1. **Basic:** Create target list
2. **Intermediate:** Add multiple contacts to list
3. **Advanced:** Create dynamic target lists

---

## Module 7: Activities (Calls, Meetings, Tasks)

### Scenario 7.1: Schedule Call
**Priority:** High  
**Module:** Calls

**Test Steps:**
1. Click "Calls" tab or "Create" → "Schedule Call"
2. Enter Subject: "Follow-up call with Acme Corp"
3. Select Status: "Planned"
4. Select Direction: "Outbound"
5. Enter Date: Future date
6. Enter Time: Specific time
7. Select Duration: 30 minutes
8. Select Related To: Account/Contact/Opportunity
9. Add invitees (optional)
10. Enter Description: "Discuss cloud migration proposal"
11. Set reminder (optional)
12. Click "Save" button

**Expected Results:**
- Call is scheduled
- Appears in calendar
- Reminder is set
- Invitees are notified
- Linked to related record

**Assignment Tasks:**
1. **Basic:** Schedule a call
2. **Intermediate:** Schedule call with multiple invitees
3. **Advanced:** Verify calendar integration
4. **Expert:** Test reminder functionality

---

### Scenario 7.2: Schedule Meeting
**Priority:** High  
**Module:** Meetings

**Test Steps:**
1. Click "Create Meeting"
2. Enter Subject: "Product Demo"
3. Select Status: "Planned"
4. Enter Date and Time
5. Select Duration: 1 hour
6. Enter Location: "Conference Room A" or virtual meeting link
7. Select Related To: Opportunity
8. Add invitees from contacts/leads
9. Enter Description and agenda
10. Set reminder: 15 minutes before
11. Click "Save" button

**Expected Results:**
- Meeting is scheduled
- Calendar entry is created
- Meeting invites are sent
- Appears in all invitees' calendars

**Assignment Tasks:**
1. **Basic:** Schedule meeting
2. **Intermediate:** Schedule with external attendees
3. **Advanced:** Test meeting updates and cancellations
4. **Expert:** Verify conflict detection

---

### Scenario 7.3: Create Task
**Priority:** Medium  
**Module:** Tasks

**Test Steps:**
1. Click "Create Task"
2. Enter Subject: "Prepare proposal for Acme Corp"
3. Select Status: "Not Started"
4. Select Priority: "High"
5. Enter Due Date: Future date
6. Select Related To: Opportunity
7. Enter Description: "Create detailed proposal including pricing and timeline"
8. Select Assigned To: User or team
9. Click "Save" button

**Expected Results:**
- Task is created
- Assigned user is notified
- Task appears in task list
- Can be tracked and completed

**Assignment Tasks:**
1. **Basic:** Create and assign task
2. **Intermediate:** Create task workflow
3. **Advanced:** Test task dependencies

---

## Module 8: Reports and Dashboards

### Scenario 8.1: Generate Sales Pipeline Report
**Priority:** High  
**Module:** Reports

**Test Steps:**
1. Navigate to Reports module
2. Select "Opportunities" reports
3. Click "Sales Pipeline" report
4. Configure filters:
   - Sales Stage: All or specific stages
   - Date Range: Current quarter
   - Assigned User: All or specific
   - Amount Range: As needed
5. Select display options (chart type, grouping)
6. Click "Run Report"
7. Export report (PDF/Excel/CSV)

**Expected Results:**
- Report is generated successfully
- Data is accurate
- Visualizations are clear
- Export works correctly

**Assignment Tasks:**
1. **Basic:** Generate predefined report
2. **Intermediate:** Customize report parameters
3. **Advanced:** Create custom report
4. **Expert:** Schedule automated report delivery

---

### Scenario 8.2: Create Custom Dashboard
**Priority:** Medium  
**Module:** Dashboards

**Test Steps:**
1. Navigate to Home/Dashboard
2. Click "Create Dashboard" or "Customize"
3. Enter Dashboard Name: "Sales Manager View"
4. Add dashlets:
   - Sales Pipeline Chart
   - Top Opportunities List
   - Recent Cases
   - Activities Calendar
   - Campaign ROI
5. Arrange and resize dashlets
6. Set refresh intervals
7. Save dashboard
8. Set as default (optional)

**Expected Results:**
- Dashboard is created
- All dashlets load correctly
- Data refreshes automatically
- Dashboard is accessible

**Assignment Tasks:**
1. **Basic:** Create simple dashboard
2. **Intermediate:** Create role-specific dashboards
3. **Advanced:** Implement interactive dashlets

---

## Integration Scenarios

### Scenario 9.1: Complete Sales Cycle (Lead to Cash)
**Priority:** High  
**Modules:** All Sales Modules

**End-to-End Workflow:**
1. Create Lead from website inquiry
2. Qualify Lead through calls and emails
3. Convert Lead to Contact, Account, and Opportunity
4. Progress Opportunity through sales stages
5. Schedule product demo (Meeting)
6. Send proposal
7. Handle objections (Cases if needed)
8. Negotiate and close deal
9. Generate invoice
10. Create customer success tasks
11. Generate reports on sales cycle

**Assignment Tasks:**
1. **Expert Level:** Automate complete sales cycle
2. Validate data flow between modules
3. Verify reporting accuracy
4. Test exception handling

---

### Scenario 9.2: Customer Support Workflow
**Priority:** High  
**Modules:** Cases, Contacts, Accounts

**Complete Workflow:**
1. Customer submits case via web form
2. Case is auto-assigned based on rules
3. Support agent reviews and updates status
4. Agent schedules call with customer
5. Case is escalated if SLA breach risk
6. Solution is provided and documented
7. Case is resolved and closed
8. Customer satisfaction survey sent
9. Case metrics are reported

**Assignment Tasks:**
1. **Advanced:** Automate support workflow
2. Test SLA compliance
3. Verify escalation rules
4. Validate customer notifications

---

## Assignments Summary

### Assignment 1: CRM Basics - Accounts and Contacts (Beginner)
**Estimated Time:** 8 hours

**Tasks:**
1. Create, edit, search accounts (Scenarios 1.1, 1.2, 1.3)
2. Create and link contacts to accounts (Scenario 2.1, 2.2)
3. Implement basic validations
4. Generate simple test report

**Deliverables:**
- Working test scripts
- Test data file
- Execution report

---

### Assignment 2: Sales Pipeline Automation (Intermediate)
**Estimated Time:** 12 hours

**Tasks:**
1. Automate lead management (Scenarios 3.1, 3.2)
2. Lead to opportunity conversion (Scenario 3.3)
3. Opportunity lifecycle (Scenarios 4.1, 4.2, 4.4)
4. Verify sales stage progression

**Deliverables:**
- Complete sales automation suite
- Pipeline verification tests
- ROI calculation validation

---

### Assignment 3: Customer Support Automation (Intermediate)
**Estimated Time:** 10 hours

**Tasks:**
1. Case creation and management (Scenarios 5.1, 5.2)
2. SLA tracking
3. Case escalation testing
4. Customer notification verification

**Deliverables:**
- Support workflow automation
- SLA compliance tests
- Escalation rule validation

---

### Assignment 4: End-to-End CRM Integration (Advanced)
**Estimated Time:** 20 hours

**Tasks:**
1. Complete sales cycle automation (Scenario 9.1)
2. Customer support workflow (Scenario 9.2)
3. Reporting and analytics automation
4. API testing integration
5. Performance testing

**Deliverables:**
- Full CRM automation framework
- API + UI test integration
- Performance benchmarks
- Comprehensive documentation

---

## Test Data Templates

### Sample Accounts
```csv
AccountName,Phone,Website,Industry,Type,AnnualRevenue,Employees
Acme Corporation,+1-555-0100,www.acme.com,Technology,Customer,5000000,250
Tech Innovations Inc,+1-555-0200,www.techinnovations.com,Software,Prospect,3000000,150
Global Solutions Ltd,+1-555-0300,www.globalsolutions.com,Consulting,Partner,10000000,500
```

### Sample Contacts
```csv
FirstName,LastName,Title,AccountName,Email,Phone
John,Doe,VP Sales,Acme Corporation,john.doe@acme.com,+1-555-0110
Sarah,Johnson,IT Director,Tech Innovations Inc,sarah.j@techinnovations.com,+1-555-0210
Michael,Brown,CEO,Global Solutions Ltd,michael.brown@globalsolutions.com,+1-555-0310
```

### Sample Opportunities
```csv
OpportunityName,AccountName,Amount,SalesStage,CloseDate,Probability
Acme-Cloud Migration,Acme Corporation,250000,Prospecting,2026-06-30,10
Tech-Enterprise License,Tech Innovations Inc,150000,Qualification,2026-05-15,25
Global-Consulting Services,Global Solutions Ltd,500000,Proposal,2026-07-30,50
```

---

## Locator Strategy

### Common SuiteCRM Locators
```
// Login
Username: id="user_name"
Password: id="username_password"
Login Button: id="bigbutton"

// Navigation
Modules: xpath=//ul[@id='moduleTab']/li
Account Tab: xpath=//a[contains(text(),'Accounts')]

// List View
Create Button: xpath=//input[@value='Create']
Search Field: id="search_name_basic"
Search Button: id="search_form_submit"

// Detail View
Edit Button: id="edit_button"
Delete Button: id="delete_button"
Save Button: id="SAVE"
Cancel Button: id="CANCEL"

// Common Fields
Account Name: id="name"
Phone: id="phone_office"
Email: id="email1"
Description: id="description"
```

---

## API Testing Guide

SuiteCRM provides REST API v8. Test endpoints:
- GET /module/{moduleName}
- GET /module/{moduleName}/{id}
- POST /module
- PATCH /module/{moduleName}/{id}
- DELETE /module/{moduleName}/{id}

**API Assignment:**
1. Authenticate and get token
2. Create records via API
3. Compare API vs UI data
4. Test bulk operations
5. Validate error handling

---

## Best Practices

1. **Page Object Model:**
   - Create page classes for each module
   - Separate test data from test logic
   - Use Page Factory for element initialization

2. **Wait Strategies:**
   - Use explicit waits for AJAX calls
   - Implement custom wait conditions
   - Handle SuiteCRM's dynamic loading

3. **Data Management:**
   - Clean up test data after execution
   - Use unique identifiers (timestamps)
   - Maintain test data independence

4. **Reporting:**
   - Implement Extent Reports or Allure
   - Capture screenshots on failure
   - Log all API requests/responses

---

## Evaluation Criteria

1. **Test Coverage (30%)** - Scenarios covered, edge cases
2. **Code Quality (25%)** - Design patterns, maintainability
3. **Framework Design (20%)** - Modularity, scalability
4. **Reporting (15%)** - Clarity, detail, visualization
5. **Best Practices (10%)** - Exception handling, performance

---

**Master CRM Test Automation! 🎯**
