# ManageEngine AssetExplorer Test Automation Project

## Project Overview
This document contains test automation scenarios for ManageEngine AssetExplorer (IT Asset Management System). Each scenario includes detailed steps, expected results, and automation assignments.

**Application Access:** Request demo at https://www.manageengine.com/products/asset-explorer/demo.html  
**Free Trial:** 30-day trial available for download  
**Demo Credentials:** Provided upon demo request

---

## Module 1: Asset Management

### Scenario 1.1: Add New Hardware Asset
**Priority:** High  
**Module:** Assets > Hardware Assets

**Preconditions:**
- User is logged in as Asset Manager or Admin
- Asset Types are configured

**Test Steps:**
1. Navigate to Assets > Add Asset
2. Select Asset Type: "Desktop" or "Laptop"
3. Fill in Asset Details:
   - Asset Name: "DESK-WS-001"
   - Asset Tag: "AT-2026-001"
   - Serial Number: "SN123456789"
   - Model: "Dell OptiPlex 7090"
   - Manufacturer: Select "Dell"
4. Fill in Purchase Information:
   - Purchase Date: Select date
   - Purchase Cost: "1200.00"
   - Vendor: Select vendor from list
   - Purchase Order Number: "PO-2026-001"
   - Invoice Number: "INV-12345"
5. Fill in Warranty Information:
   - Warranty Expiry Date: Select future date
   - Warranty Type: "Manufacturer Warranty"
   - Warranty Provider: "Dell"
6. Fill in Location Details:
   - Department: Select from dropdown (e.g., "IT Department")
   - Location: Select site/building
   - Room/Desk: "Room 301, Desk 5"
7. Fill in User Assignment:
   - Used By: Select user from dropdown
   - Assigned To: Select technician
8. Add Asset Specifications:
   - Processor: "Intel Core i7-11700"
   - RAM: "16 GB"
   - Hard Disk: "512 GB SSD"
   - Operating System: "Windows 11 Pro"
9. Enter Additional Information:
   - Notes: "Primary workstation for development team"
   - Status: "In Use"
10. Click "Save" button

**Expected Results:**
- Asset is created successfully
- Success notification appears
- Asset appears in asset list
- Asset tag is unique
- Asset is assigned to user
- All entered data is saved correctly
- Asset depreciation starts calculating

**Assignment Tasks:**
1. **Basic:** Automate hardware asset creation with mandatory fields
2. **Intermediate:** Create asset with all fields and verify all data
3. **Advanced:** Create multiple assets using data-driven approach
4. **Expert:** Validate asset tag uniqueness and duplicate prevention

**Validation Points:**
- Verify unique asset tag generation
- Verify purchase cost is numeric
- Verify warranty expiry is future date
- Verify user assignment relationship
- Verify depreciation calculation initialization

---

### Scenario 1.2: Search and Filter Assets
**Priority:** High  
**Module:** Assets

**Preconditions:**
- Multiple assets exist in the system
- User has view permissions

**Test Steps:**
1. Navigate to Assets > All Assets
2. Use Quick Search:
   - Enter search term: "DESK-WS"
   - Click "Search" button
3. Use Advanced Search:
   - Click "Advanced Search" icon
   - Select Asset Type: "Desktop"
   - Select Status: "In Use"
   - Select Department: "IT Department"
   - Enter Purchase Date Range: From/To dates
   - Enter Cost Range: Min/Max values
   - Select Manufacturer: "Dell"
   - Select Location: Specific site
4. Click "Search" button
5. Apply filters from column headers
6. Use saved searches/filters

**Expected Results:**
- Quick search returns matching assets
- Advanced search applies all criteria correctly
- Results can be sorted by columns
- Filters work independently and combined
- Result count is displayed
- Search results can be exported

**Assignment Tasks:**
1. **Basic:** Automate basic asset search
2. **Intermediate:** Test all filter combinations
3. **Advanced:** Verify search result accuracy against database
4. **Expert:** Test search performance with large datasets

---

### Scenario 1.3: Update Asset Information
**Priority:** High  
**Module:** Assets

**Preconditions:**
- Asset "DESK-WS-001" exists
- User has edit permissions

**Test Steps:**
1. Navigate to Assets > All Assets
2. Search for asset "DESK-WS-001"
3. Click on asset name to open details
4. Click "Edit" button
5. Update the following:
   - Status: Change from "In Use" to "Under Maintenance"
   - Location: Update to different location
   - RAM: Upgrade from "16 GB" to "32 GB"
   - Notes: Add maintenance information
6. Update Warranty:
   - Extended Warranty: Yes
   - New Expiry Date: Extended date
7. Click "Save" button
8. Verify changes in asset history/audit log

**Expected Results:**
- All updates are saved successfully
- Asset history tracks changes
- Modified timestamp is updated
- User who made changes is recorded
- Notifications sent (if configured)
- Asset status change triggers workflow

**Assignment Tasks:**
1. **Basic:** Edit and update asset details
2. **Intermediate:** Verify audit trail for changes
3. **Advanced:** Test concurrent edit scenarios
4. **Expert:** Validate business rules for status changes

---

### Scenario 1.4: Asset Transfer (User/Location)
**Priority:** High  
**Module:** Assets

**Preconditions:**
- Asset exists and is assigned
- Multiple users and locations available

**Test Steps:**
1. Open asset detail view
2. Click "Transfer" or "Reassign" button
3. Select Transfer Type:
   - User Transfer
   - Location Transfer
   - Both
4. For User Transfer:
   - Current User: Auto-populated
   - New User: Select from dropdown
   - Transfer Date: Select date
   - Reason: "Employee transfer"
5. For Location Transfer:
   - Current Location: Auto-populated
   - New Location: Select from dropdown
   - Transfer Date: Select date
   - Reason: "Office relocation"
6. Enter Transfer Notes
7. Click "Transfer" or "Save" button
8. Verify email notifications sent to old and new users

**Expected Results:**
- Transfer is recorded successfully
- Asset assignment is updated
- Transfer history is maintained
- Both users are notified
- Asset appears in new location inventory
- Reports reflect the transfer

**Assignment Tasks:**
1. **Basic:** Automate user transfer
2. **Intermediate:** Automate location transfer and verify
3. **Advanced:** Test bulk transfer operations
4. **Expert:** Validate transfer approval workflow (if enabled)

---

### Scenario 1.5: Asset Retirement/Disposal
**Priority:** Medium  
**Module:** Assets

**Preconditions:**
- Asset exists in system
- Asset is ready for disposal
- User has disposal permissions

**Test Steps:**
1. Navigate to asset detail view
2. Click "Retire Asset" or change status to "Retired"
3. Fill in Disposal Information:
   - Disposal Date: Select date
   - Disposal Method: Select (Sold/Donated/Recycled/Destroyed)
   - Disposal Value: Enter amount (if sold)
   - Disposal Vendor: Enter vendor name
   - Approval Required: Yes/No
4. Enter Reason: "End of useful life"
5. Upload disposal certificate (if applicable)
6. Click "Save" button
7. If approval required, submit for approval

**Expected Results:**
- Asset status changed to "Retired" or "Disposed"
- Asset removed from active inventory
- Disposal record is created
- Asset value is written off
- Asset appears in disposal reports
- Approval workflow initiated (if configured)

**Assignment Tasks:**
1. **Basic:** Retire an asset
2. **Intermediate:** Complete disposal with all details
3. **Advanced:** Test disposal approval workflow
4. **Expert:** Verify financial impact and reporting

---

## Module 2: Software Asset Management

### Scenario 2.1: Add Software License
**Priority:** High  
**Module:** Software > Licenses

**Preconditions:**
- User has software management permissions
- Software publishers/vendors are configured

**Test Steps:**
1. Navigate to Software > Add License
2. Enter License Details:
   - Software Name: "Microsoft Office 365"
   - Publisher: "Microsoft Corporation"
   - Version: "2024 Professional Plus"
   - License Type: "Volume License"
   - License Key: "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
3. Enter License Count Information:
   - Total Licenses: "50"
   - Used Licenses: "0" (will auto-calculate)
   - Available Licenses: "50"
4. Enter Purchase Information:
   - Purchase Date: Select date
   - Purchase Cost: "15000.00"
   - Cost Per License: Auto-calculated or manual
   - Vendor: Select vendor
   - Purchase Order: "PO-SW-2026-001"
5. Enter License Period:
   - License Start Date: Current date
   - License Expiry Date: Future date (e.g., 1 year)
   - Renewal Required: Yes
   - Renewal Alert: 30 days before expiry
6. Enter Support Information:
   - Support Expiry Date: Same as license or different
   - Support Provider: "Microsoft"
   - Support Contact: Email/Phone
7. Enter Compliance Information:
   - Compliance Status: "Compliant"
   - Audit Trail: Yes
8. Add Notes/Attachments
9. Click "Save" button

**Expected Results:**
- License is created successfully
- Available license count is accurate
- Expiry alert is scheduled
- License appears in software inventory
- Compliance tracking is activated

**Assignment Tasks:**
1. **Basic:** Create software license
2. **Intermediate:** Create license and verify calculations
3. **Advanced:** Test license renewal alerts
4. **Expert:** Validate compliance tracking

**Validation Points:**
- Verify license count calculations
- Verify expiry date is future date
- Verify cost per license calculation
- Verify unique license key

---

### Scenario 2.2: Assign Software to Assets/Users
**Priority:** High  
**Module:** Software > Installations

**Preconditions:**
- Software license exists
- Hardware assets/users exist
- Available licenses > 0

**Test Steps:**
1. Navigate to Software > Installed Software
2. Click "Install Software" or "Add Installation"
3. Select Software: "Microsoft Office 365"
4. Select Installation Type:
   - Asset-based installation
   - User-based installation
5. For Asset-based:
   - Select Asset: "DESK-WS-001"
   - Enter Installation Date: Current date
   - Enter Installation Path: "C:\Program Files\Microsoft Office"
6. For User-based:
   - Select User: From dropdown
   - Select Device: If specific device
7. Enter Version Installed: "2024"
8. Enter License Key Used: Select from available keys
9. Installation Status: "Active"
10. Enter Notes: "Installed for productivity work"
11. Click "Save" button
12. Verify license count decrements

**Expected Results:**
- Installation is recorded
- License count decreases (Used +1, Available -1)
- Software appears in asset's software list
- Installation appears in user's software list
- Compliance status is updated

**Assignment Tasks:**
1. **Basic:** Assign software to single asset
2. **Intermediate:** Assign software to multiple assets
3. **Advanced:** Test license limit enforcement
4. **Expert:** Verify compliance when over-allocated

---

### Scenario 2.3: Software Compliance Check
**Priority:** High  
**Module:** Software > Compliance

**Test Steps:**
1. Navigate to Software > Compliance Report
2. Select Software: "Microsoft Office 365" or "All Software"
3. Select Date Range: Current period
4. Click "Generate Report"
5. Review compliance metrics:
   - Total Licenses
   - Used Licenses
   - Available Licenses
   - Over/Under Allocated
   - Prohibited Software (if any)
6. View details of:
   - Compliant installations
   - Non-compliant installations
   - Unlicensed software
7. Export compliance report

**Expected Results:**
- Report generates successfully
- All metrics are accurate
- Non-compliant items are highlighted
- Report can be exported (PDF/Excel/CSV)
- Recommendations are provided

**Assignment Tasks:**
1. **Basic:** Generate compliance report
2. **Intermediate:** Validate compliance calculations
3. **Advanced:** Test compliance across multiple software
4. **Expert:** Automate compliance monitoring and alerts

---

### Scenario 2.4: License Renewal Process
**Priority:** Medium  
**Module:** Software > License Renewal

**Preconditions:**
- License is approaching expiry
- User has renewal permissions

**Test Steps:**
1. Navigate to Software > Expiring Licenses
2. Select license approaching expiry
3. Click "Renew License" button
4. Update Renewal Information:
   - New Expiry Date: Extend by 1 year
   - Renewal Cost: Enter new cost
   - Renewal Order Number: "PO-RNW-2026-001"
   - Renewal Date: Current date
5. Update License Count (if changed):
   - New Total Licenses: Updated count
6. Upload renewal invoice/agreement
7. Click "Save" button
8. Verify renewal is recorded
9. Verify old expiry is archived
10. Verify new alert is scheduled

**Expected Results:**
- License is renewed successfully
- New expiry date is set
- Old license history is preserved
- Renewal cost is tracked
- Alert is rescheduled
- Renewal appears in reports

**Assignment Tasks:**
1. **Basic:** Renew a license
2. **Intermediate:** Test renewal workflow
3. **Advanced:** Automate renewal reminders
4. **Expert:** Verify cost tracking across renewals

---

## Module 3: Purchase Order Management

### Scenario 3.1: Create Purchase Order
**Priority:** High  
**Module:** Purchase Orders

**Preconditions:**
- User has PO creation permissions
- Vendors are configured
- Assets/Products exist in catalog

**Test Steps:**
1. Navigate to Purchase Orders > Add PO
2. Enter PO Details:
   - PO Number: "PO-2026-001" (auto or manual)
   - PO Date: Current date
   - Vendor: Select vendor
   - Department: "IT Department"
   - Requested By: Current user or select
   - Expected Delivery Date: Future date
3. Add Line Items:
   - Click "Add Item"
   - Select Product Type: Hardware/Software
   - Select Product: "Dell Laptop" or create new
   - Enter Quantity: "5"
   - Enter Unit Cost: "1500.00"
   - Line Total: Auto-calculated (Quantity × Unit Cost)
   - Enter Description: "Laptops for new hires"
4. Repeat for additional items
5. Review PO Summary:
   - Subtotal: Sum of line items
   - Tax: Enter tax amount or percentage
   - Shipping: Enter shipping cost
   - Total: Grand total
6. Enter Billing Address
7. Enter Shipping Address
8. Enter Terms and Conditions
9. Add Notes: "Rush delivery required"
10. Attach documents (quotes, approvals)
11. Click "Save" or "Submit" button
12. If approval required, submit for approval

**Expected Results:**
- PO is created successfully
- PO number is generated
- Line items are saved
- Totals are calculated correctly
- PO status is "Draft" or "Pending Approval"
- Approval workflow initiated (if configured)
- Vendor is notified (if configured)

**Assignment Tasks:**
1. **Basic:** Create PO with single line item
2. **Intermediate:** Create PO with multiple items and verify totals
3. **Advanced:** Test PO approval workflow
4. **Expert:** Validate budget checking and compliance

**Validation Points:**
- Verify PO number uniqueness
- Verify quantity must be > 0
- Verify cost calculations
- Verify delivery date is future date
- Verify vendor is active

---

### Scenario 3.2: Approve Purchase Order
**Priority:** High  
**Module:** Purchase Orders > Approvals

**Preconditions:**
- PO exists in "Pending Approval" status
- User has approval permissions

**Test Steps:**
1. Navigate to Purchase Orders > Pending Approvals
2. Select PO to approve
3. Review PO details:
   - Items ordered
   - Quantities and costs
   - Vendor information
   - Budget impact
4. Click "Approve" button
5. Enter approval comments: "Approved for Q1 budget"
6. Click "Confirm" or "Submit"

**For Rejection:**
1. Click "Reject" button
2. Enter rejection reason: "Exceeds quarterly budget"
3. Add comments for requester
4. Click "Confirm"

**Expected Results:**
- PO status changes to "Approved" or "Rejected"
- Requester is notified
- If approved, PO can proceed to ordering
- If rejected, PO returns to requester
- Approval/rejection is logged in history
- Budget is reserved (if approved)

**Assignment Tasks:**
1. **Basic:** Approve a purchase order
2. **Intermediate:** Test approval and rejection workflows
3. **Advanced:** Test multi-level approval chains
4. **Expert:** Validate approval delegation and escalation

---

### Scenario 3.3: Receive Assets from PO
**Priority:** High  
**Module:** Purchase Orders > Receiving

**Preconditions:**
- PO is approved and ordered
- Assets are delivered
- User has receiving permissions

**Test Steps:**
1. Navigate to Purchase Orders > Open Orders
2. Select PO to receive
3. Click "Receive Items" or "Goods Receipt"
4. For each line item:
   - Ordered Quantity: Display ordered amount
   - Received Quantity: Enter actual received
   - Received Date: Select date
   - Received By: Current user
   - Condition: Select (New/Refurbished/Damaged)
   - Notes: Add any remarks
5. If partial receipt:
   - Mark items received
   - Leave remaining for future receipt
6. Upload delivery note/packing slip
7. Enter actual costs (if different from PO)
8. Click "Save" or "Complete Receipt"
9. System creates assets from received items:
   - Auto-generate asset tags
   - Link to PO
   - Set status to "In Stock"

**Expected Results:**
- Receipt is recorded
- Assets are created automatically
- Asset tags are generated
- PO status updates (Partially Received/Fully Received)
- Inventory is updated
- Received assets appear in stock
- Variance between ordered and received is tracked

**Assignment Tasks:**
1. **Basic:** Receive full PO
2. **Intermediate:** Handle partial receipts
3. **Advanced:** Test variance handling
4. **Expert:** Verify automatic asset creation

---

## Module 4: Contract Management

### Scenario 4.1: Create Vendor Contract
**Priority:** High  
**Module:** Contracts

**Preconditions:**
- Vendor exists in system
- User has contract management permissions

**Test Steps:**
1. Navigate to Contracts > Add Contract
2. Enter Contract Details:
   - Contract Name: "Dell Maintenance Agreement 2026"
   - Contract Type: "Service Contract" or "Support Contract"
   - Contract Number: "CNT-2026-001"
   - Vendor/Service Provider: Select vendor
3. Enter Contract Period:
   - Start Date: Current date
   - End Date: Future date (e.g., 1-3 years)
   - Contract Duration: Auto-calculated or manual
   - Renewal Required: Yes/No
   - Renewal Alert: 60 days before expiry
4. Enter Financial Details:
   - Contract Value: "50000.00"
   - Payment Terms: "Annual"
   - Payment Schedule: Define schedule
   - Currency: "USD"
5. Define Contract Scope:
   - Covered Assets: Select assets or asset types
   - Services Included: List services
   - Response Time SLA: "4 hours"
   - Resolution Time SLA: "24 hours"
6. Enter Contact Information:
   - Vendor Contact Person: Name, email, phone
   - Internal Contact: Assign contract manager
7. Upload Contract Documents:
   - Signed contract PDF
   - Terms and conditions
   - SLA document
8. Enter Notes and Special Terms
9. Click "Save" button

**Expected Results:**
- Contract is created successfully
- Contract appears in active contracts
- Renewal alert is scheduled
- Contract is linked to vendor and assets
- All documents are attached
- Contract can be tracked and monitored

**Assignment Tasks:**
1. **Basic:** Create a service contract
2. **Intermediate:** Create contract with SLA terms
3. **Advanced:** Link contract to multiple assets
4. **Expert:** Test contract renewal workflow

---

### Scenario 4.2: Track Contract Compliance
**Priority:** Medium  
**Module:** Contracts > Compliance

**Test Steps:**
1. Navigate to Contracts > All Contracts
2. Select active contract
3. Monitor compliance metrics:
   - SLA adherence
   - Service requests under contract
   - Response time tracking
   - Resolution time tracking
4. Review contract utilization:
   - Services used vs. included
   - Remaining value
   - Assets covered
5. Generate compliance report

**Expected Results:**
- Compliance metrics are displayed
- SLA breaches are highlighted
- Utilization is tracked
- Report is comprehensive

**Assignment Tasks:**
1. **Intermediate:** Track SLA compliance
2. **Advanced:** Generate compliance reports
3. **Expert:** Automate SLA monitoring

---

## Module 5: Asset Audit

### Scenario 5.1: Initiate Asset Audit
**Priority:** High  
**Module:** Audit

**Preconditions:**
- Assets exist in system
- User has audit permissions

**Test Steps:**
1. Navigate to Audit > Start Audit
2. Enter Audit Details:
   - Audit Name: "Q1 2026 Physical Asset Audit"
   - Audit Type: "Physical Audit" or "IT Audit"
   - Audit Scope: Select scope
     - All Assets
     - Specific Department
     - Specific Location
     - Specific Asset Type
3. Select Audit Period:
   - Start Date: Current date
   - End Date: Future date
4. Assign Audit Team:
   - Audit Manager: Select user
   - Audit Team Members: Select multiple users
5. Define Audit Checklist:
   - Verify physical existence
   - Verify asset tag
   - Verify location
   - Verify user assignment
   - Verify asset condition
   - Verify asset specifications
6. Select Assets to Audit:
   - Auto-select based on scope
   - Or manually select assets
7. Click "Start Audit" button
8. System generates audit worksheet/checklist

**Expected Results:**
- Audit is initiated
- Audit team is notified
- Assets are marked "Under Audit"
- Audit worksheet is generated
- Audit appears in active audits list

**Assignment Tasks:**
1. **Basic:** Initiate an audit
2. **Intermediate:** Configure audit scope and checklist
3. **Advanced:** Assign audit team and verify notifications
4. **Expert:** Customize audit workflows

---

### Scenario 5.2: Conduct Asset Audit
**Priority:** High  
**Module:** Audit > Audit Execution

**Preconditions:**
- Audit is initiated
- User is part of audit team

**Test Steps:**
1. Access audit worksheet
2. For each asset in audit:
   - Locate physical asset
   - Scan or enter asset tag
   - Verify asset details:
     - Asset found: Yes/No
     - Location matches: Yes/No
     - User matches: Yes/No
     - Condition: Good/Fair/Poor
     - Specifications match: Yes/No
   - Take photo of asset (if supported)
   - Enter audit notes/findings
   - Mark status: Verified/Discrepancy/Not Found
3. Handle discrepancies:
   - Asset not found: Mark as missing
   - Asset found in wrong location: Update location
   - Asset assigned to wrong user: Update assignment
   - Asset specifications don't match: Update details
   - Unknown asset found: Add as new asset
4. Submit audit findings

**Expected Results:**
- All assets are audited
- Discrepancies are identified
- Findings are recorded
- Photos are attached (if applicable)
- Audit completion percentage is tracked

**Assignment Tasks:**
1. **Basic:** Audit assets and mark as verified
2. **Intermediate:** Handle discrepancies during audit
3. **Advanced:** Add new assets found during audit
4. **Expert:** Generate exception reports

---

### Scenario 5.3: Complete Audit and Generate Report
**Priority:** High  
**Module:** Audit > Reports

**Preconditions:**
- Audit is completed or in final stage
- All assets are audited

**Test Steps:**
1. Navigate to audit details
2. Review audit summary:
   - Total assets in scope
   - Assets verified
   - Assets with discrepancies
   - Assets not found
   - New assets discovered
3. Resolve discrepancies:
   - Update asset records
   - Initiate investigations
   - Mark as resolved or pending
4. Click "Complete Audit" button
5. Generate audit report:
   - Select report type: Summary/Detailed/Exception
   - Configure report parameters
   - Include photos/evidence
6. Click "Generate Report"
7. Review report:
   - Executive summary
   - Audit findings
   - Discrepancies list
   - Recommendations
   - Action items
8. Export report (PDF/Excel)
9. Submit for approval (if required)
10. Close audit

**Expected Results:**
- Audit is completed successfully
- Comprehensive report is generated
- All discrepancies are documented
- Asset records are updated
- Audit is archived
- Stakeholders are notified

**Assignment Tasks:**
1. **Basic:** Complete audit and generate basic report
2. **Intermediate:** Generate detailed audit report with all findings
3. **Advanced:** Test exception handling and reporting
4. **Expert:** Automate post-audit asset updates

---

## Module 6: Asset Depreciation

### Scenario 6.1: Configure Depreciation Rules
**Priority:** Medium  
**Module:** Admin > Depreciation Settings

**Preconditions:**
- User has admin permissions
- Asset types exist

**Test Steps:**
1. Navigate to Admin > Asset Settings > Depreciation
2. Create depreciation rule:
   - Rule Name: "IT Equipment Depreciation"
   - Asset Type: "Desktop Computers"
   - Depreciation Method: Select method
     - Straight Line
     - Declining Balance
     - Sum of Years Digits
3. For Straight Line Method:
   - Useful Life: "5 years" or "60 months"
   - Salvage Value %: "10%"
4. Set calculation frequency:
   - Monthly
   - Quarterly
   - Annually
5. Click "Save" button
6. Apply rule to existing assets (if needed)

**Expected Results:**
- Depreciation rule is created
- Rule can be applied to asset types
- Existing assets can be reprocessed
- Future assets will use rule automatically

**Assignment Tasks:**
1. **Intermediate:** Configure depreciation rules
2. **Advanced:** Test different depreciation methods
3. **Expert:** Verify depreciation calculations

---

### Scenario 6.2: View Depreciation Report
**Priority:** Medium  
**Module:** Reports > Depreciation

**Test Steps:**
1. Navigate to Reports > Financial Reports > Depreciation
2. Select parameters:
   - Asset Type: All or specific
   - Date Range: Year/Quarter/Custom
   - Department: All or specific
3. Click "Generate Report"
4. Review report showing:
   - Asset original cost
   - Accumulated depreciation
   - Net book value
   - Current period depreciation
5. Export report

**Expected Results:**
- Report is generated accurately
- All calculations are correct
- Report can be exported
- Data matches asset records

**Assignment Tasks:**
1. **Intermediate:** Generate depreciation reports
2. **Advanced:** Validate depreciation calculations
3. **Expert:** Test year-end depreciation processing

---

## Module 7: Reports and Analytics

### Scenario 7.1: Generate Asset Inventory Report
**Priority:** High  
**Module:** Reports

**Test Steps:**
1. Navigate to Reports > Asset Reports
2. Select "Asset Inventory Report"
3. Configure report parameters:
   - Asset Type: All or specific
   - Status: All or specific
   - Department: Select department
   - Location: Select location
   - Date Range: As of date
4. Select columns to display:
   - Asset Name
   - Asset Tag
   - Serial Number
   - User
   - Location
   - Purchase Cost
   - Status
5. Select grouping and sorting
6. Click "Generate Report"
7. Export report (PDF/Excel/CSV)

**Expected Results:**
- Report generates successfully
- All selected data is displayed
- Grouping and sorting work correctly
- Export formats work
- Report is accurate

**Assignment Tasks:**
1. **Basic:** Generate standard inventory report
2. **Intermediate:** Customize report with specific fields
3. **Advanced:** Create scheduled reports
4. **Expert:** Build custom dashboard with multiple reports

---

### Scenario 7.2: Software License Utilization Report
**Priority:** High  
**Module:** Reports > Software Reports

**Test Steps:**
1. Navigate to Reports > Software License Reports
2. Select "License Utilization Report"
3. Configure parameters:
   - Software: All or specific
   - Publisher: All or specific
   - Date Range: Current period
4. View metrics:
   - Total licenses
   - Used licenses
   - Available licenses
   - Utilization percentage
   - Cost per license
   - Total investment
5. Identify under-utilized licenses
6. Identify over-allocated licenses
7. Export report

**Expected Results:**
- Report shows accurate license data
- Utilization percentages are correct
- Cost analysis is displayed
- Optimization recommendations provided

**Assignment Tasks:**
1. **Intermediate:** Generate license reports
2. **Advanced:** Analyze license optimization opportunities
3. **Expert:** Create cost-saving recommendations

---

### Scenario 7.3: Asset Lifecycle Report
**Priority:** Medium  
**Module:** Reports > Lifecycle Reports

**Test Steps:**
1. Navigate to Reports > Asset Lifecycle
2. Select asset or asset type
3. View lifecycle stages:
   - Procurement
   - Deployment
   - Maintenance
   - Transfer history
   - Retirement
4. View associated costs:
   - Purchase cost
   - Maintenance cost
   - Support cost
   - Total cost of ownership (TCO)
5. Export lifecycle report

**Expected Results:**
- Complete lifecycle is displayed
- All stages are documented
- Costs are tracked
- TCO is calculated

**Assignment Tasks:**
1. **Advanced:** Generate lifecycle reports
2. **Expert:** Calculate and validate TCO

---

## Integration Scenarios

### Scenario 8.1: Complete Asset Lifecycle
**Priority:** High  
**Modules:** All

**End-to-End Workflow:**
1. Create purchase order for new assets
2. Get PO approved
3. Receive assets from PO
4. Assets auto-created in inventory
5. Assign assets to users
6. Track asset through lifecycle
7. Perform periodic audits
8. Transfer assets as needed
9. Track maintenance and contracts
10. Monitor depreciation
11. Eventually retire/dispose assets
12. Generate comprehensive reports

**Assignment Tasks:**
1. **Expert Level:** Automate complete asset lifecycle
2. Verify data integrity across all stages
3. Test integration between all modules
4. Validate reporting accuracy

---

### Scenario 8.2: IT Asset Management Workflow
**Priority:** High  
**Modules:** Assets, Software, Contracts, PO

**Complete Workflow:**
1. Identify need for new IT equipment
2. Create and approve purchase order
3. Receive hardware and software
4. Deploy to users with software licenses
5. Track under service contracts
6. Monitor compliance and utilization
7. Perform regular audits
8. Renew contracts and licenses
9. Retire outdated equipment
10. Generate asset and financial reports

**Assignment Tasks:**
1. **Expert:** Automate IT asset management workflow
2. Test compliance across all modules
3. Verify financial accuracy
4. Validate audit trail

---

## Assignments Summary

### Assignment 1: Asset Management Basics (Beginner)
**Estimated Time:** 8 hours

**Tasks:**
1. Create, search, update assets (Scenarios 1.1, 1.2, 1.3)
2. Transfer assets (Scenario 1.4)
3. Basic validations
4. Simple reports

**Deliverables:**
- Asset CRUD automation
- Test execution report
- Asset data validation

---

### Assignment 2: Software License Management (Intermediate)
**Estimated Time:** 12 hours

**Tasks:**
1. Create and manage licenses (Scenarios 2.1, 2.2)
2. Track compliance (Scenario 2.3)
3. License renewal (Scenario 2.4)
4. Utilization reports

**Deliverables:**
- License management automation
- Compliance verification tests
- Utilization analysis

---

### Assignment 3: Purchase and Contract Management (Intermediate)
**Estimated Time:** 10 hours

**Tasks:**
1. PO creation and approval (Scenarios 3.1, 3.2)
2. Asset receiving (Scenario 3.3)
3. Contract management (Scenarios 4.1, 4.2)

**Deliverables:**
- PO workflow automation
- Receipt verification
- Contract tracking tests

---

### Assignment 4: Complete ITAM Integration (Advanced)
**Estimated Time:** 20 hours

**Tasks:**
1. Full asset lifecycle automation (Scenario 8.1)
2. IT asset management workflow (Scenario 8.2)
3. Audit automation (Scenarios 5.1, 5.2, 5.3)
4. Advanced reporting and analytics
5. API integration testing

**Deliverables:**
- Complete ITAM framework
- End-to-end workflow tests
- API + UI integration
- Comprehensive documentation
- Performance benchmarks

---

## Test Data Templates

### Sample Hardware Assets
```csv
AssetName,AssetTag,SerialNumber,Model,Manufacturer,Cost,PurchaseDate,Department,User
DESK-WS-001,AT-001,SN12345,OptiPlex 7090,Dell,1200.00,2026-01-15,IT,john.doe
DESK-WS-002,AT-002,SN12346,OptiPlex 7090,Dell,1200.00,2026-01-15,IT,jane.smith
LAP-001,AT-003,SN12347,Latitude 7420,Dell,1500.00,2026-01-20,Sales,mike.brown
```

### Sample Software Licenses
```csv
SoftwareName,Publisher,Version,LicenseType,TotalLicenses,CostPerLicense,ExpiryDate
Microsoft Office 365,Microsoft,2024,Volume License,50,300.00,2027-01-31
Adobe Creative Cloud,Adobe,2024,Subscription,10,600.00,2027-02-28
Zoom Pro,Zoom,Current,Subscription,25,180.00,2027-01-15
```

### Sample Purchase Orders
```csv
PONumber,Vendor,PODate,DeliveryDate,TotalAmount,Status
PO-2026-001,Dell Inc,2026-01-10,2026-02-10,6000.00,Approved
PO-2026-002,CDW,2026-01-15,2026-02-15,15000.00,Pending
PO-2026-003,SHI International,2026-01-20,2026-02-20,4500.00,Draft
```

---

## Locator Strategy

### Common AssetExplorer Locators
```
// Login
Username: id="userName"
Password: id="password"
Login Button: id="loginButton"

// Navigation
Assets Menu: xpath=//a[contains(text(),'Assets')]
Add Asset: id="addAsset"

// Asset Form
Asset Name: id="assetName"
Asset Tag: id="assetTag"
Serial Number: id="serialNumber"
Save Button: id="saveButton"

// Search
Search Field: id="searchBox"
Search Button: id="searchBtn"
Advanced Search: id="advSearch"

// Lists
Asset List Table: id="assetListTable"
Checkboxes: class="assetCheckbox"
```

---

## API Testing Guide

ManageEngine AssetExplorer provides REST API. Test:
- GET /api/v3/assets
- GET /api/v3/assets/{id}
- POST /api/v3/assets
- PUT /api/v3/assets/{id}
- DELETE /api/v3/assets/{id}
- Software license endpoints
- Purchase order endpoints

**API Tasks:**
1. Authenticate via API
2. CRUD operations via API
3. Compare API vs UI data
4. Bulk operations
5. Error handling

---

## Best Practices

1. **Framework Design:**
   - Implement Page Object Model
   - Separate business logic from tests
   - Use data-driven approach
   - Implement proper logging

2. **Test Data:**
   - Use unique identifiers
   - Clean up after tests
   - Maintain test data independence
   - Use realistic data

3. **Validation:**
   - Verify database updates
   - Check audit trails
   - Validate calculations
   - Verify workflows

4. **Reporting:**
   - Implement detailed reports
   - Capture screenshots
   - Log all actions
   - Track metrics

---

## Evaluation Criteria

1. **Test Coverage (30%)** - Scenarios, edge cases
2. **Code Quality (25%)** - Design, maintainability
3. **Framework Design (20%)** - Scalability, reusability
4. **Reporting (15%)** - Clarity, detail
5. **Best Practices (10%)** - Standards, performance

---

**Master IT Asset Management Automation! 🚀**
