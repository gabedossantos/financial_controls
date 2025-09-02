import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedEmployee {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  manager?: string;
}

const departments = [
  {
    name: "Finance",
    code: "FIN",
    description: "Financial operations and accounting",
  },
  {
    name: "Information Technology",
    code: "IT",
    description: "Technology infrastructure and development",
  },
  {
    name: "Human Resources",
    code: "HR",
    description: "Human resources and personnel management",
  },
  {
    name: "Operations",
    code: "OPS",
    description: "Business operations and logistics",
  },
  {
    name: "Procurement",
    code: "PROC",
    description: "Vendor management and purchasing",
  },
];

const roles = [
  // Finance Roles
  {
    name: "Accounts Payable Clerk",
    code: "AP_CLERK",
    department: "Finance",
    riskLevel: 2,
    description:
      "Responsible for processing invoices and managing accounts payable",
    conflictingRoles: ["PAYMENT_APPROVER", "VENDOR_ADMIN"],
    permissions: ["INVOICE_CREATE", "INVOICE_EDIT", "VENDOR_VIEW"],
  },
  {
    name: "Accounts Receivable Clerk",
    code: "AR_CLERK",
    department: "Finance",
    riskLevel: 2,
    description: "Manages customer invoices and payment collection",
    conflictingRoles: [],
    permissions: ["CUSTOMER_INVOICE", "PAYMENT_RECORD", "CUSTOMER_VIEW"],
  },
  {
    name: "Payment Approver",
    code: "PAYMENT_APPROVER",
    department: "Finance",
    riskLevel: 4,
    description: "Authorizes financial payments and disbursements",
    conflictingRoles: ["AP_CLERK", "VENDOR_ADMIN"],
    permissions: ["PAYMENT_APPROVE", "PAYMENT_VIEW", "VENDOR_VIEW"],
  },
  {
    name: "Financial Controller",
    code: "CONTROLLER",
    department: "Finance",
    riskLevel: 5,
    description: "Oversees financial operations and reporting",
    conflictingRoles: ["JOURNAL_CLERK"],
    permissions: [
      "JOURNAL_APPROVE",
      "REPORT_VIEW",
      "AUDIT_VIEW",
      "PAYMENT_APPROVE",
    ],
  },
  {
    name: "Journal Entry Clerk",
    code: "JOURNAL_CLERK",
    department: "Finance",
    riskLevel: 3,
    description: "Creates and manages journal entries and accounting records",
    conflictingRoles: ["CONTROLLER"],
    permissions: ["JOURNAL_ENTRY_CREATE", "JOURNAL_ENTRY_EDIT", "ACCOUNT_VIEW"],
  },
  {
    name: "Cash Management Specialist",
    code: "CASH_MGR",
    department: "Finance",
    riskLevel: 4,
    description: "Manages cash flow and treasury operations",
    conflictingRoles: ["BANK_RECONCILER"],
    permissions: ["CASH_MANAGEMENT", "BANK_VIEW", "TRANSFER_EXECUTE"],
  },
  {
    name: "Bank Reconciliation Analyst",
    code: "BANK_RECONCILER",
    department: "Finance",
    riskLevel: 3,
    description: "Performs bank reconciliations and account analysis",
    conflictingRoles: ["CASH_MGR"],
    permissions: ["BANK_RECONCILIATION", "BANK_VIEW", "RECONCILE_EXECUTE"],
  },

  // IT Roles
  {
    name: "System Administrator",
    code: "SYSADMIN",
    department: "IT",
    riskLevel: 5,
    description: "Manages system infrastructure and technical operations",
    conflictingRoles: ["USER_ADMIN", "SECURITY_ADMIN"],
    permissions: ["SYSTEM_ACCESS", "DATABASE_ADMIN", "BACKUP_RESTORE"],
  },
  {
    name: "User Administrator",
    code: "USER_ADMIN",
    department: "IT",
    riskLevel: 4,
    description: "Manages user accounts and access permissions",
    conflictingRoles: ["SYSADMIN"],
    permissions: [
      "USER_CREATE",
      "USER_EDIT",
      "PERMISSION_ASSIGN",
      "ROLE_ASSIGN",
    ],
  },
  {
    name: "Database Administrator",
    code: "DBA",
    department: "IT",
    riskLevel: 4,
    description: "Manages database systems and data integrity",
    conflictingRoles: ["SECURITY_ADMIN"],
    permissions: ["DATABASE_ADMIN", "DATA_ACCESS", "SCHEMA_MODIFY"],
  },
  {
    name: "Security Administrator",
    code: "SECURITY_ADMIN",
    department: "IT",
    riskLevel: 5,
    description: "Manages security policies and access controls",
    conflictingRoles: ["SYSADMIN", "DBA"],
    permissions: ["SECURITY_CONFIG", "ACCESS_CONTROL", "AUDIT_VIEW"],
  },

  // HR Roles
  {
    name: "HR Generalist",
    code: "HR_GENERALIST",
    department: "HR",
    riskLevel: 2,
    description:
      "Handles general human resources functions and employee relations",
    conflictingRoles: ["PAYROLL_ADMIN"],
    permissions: ["EMPLOYEE_VIEW", "EMPLOYEE_EDIT", "DOCUMENT_MANAGE"],
  },
  {
    name: "Payroll Administrator",
    code: "PAYROLL_ADMIN",
    department: "HR",
    riskLevel: 4,
    description: "Processes payroll and manages compensation data",
    conflictingRoles: ["HR_GENERALIST", "PAYROLL_APPROVER"],
    permissions: ["PAYROLL_PROCESS", "PAYROLL_EDIT", "SALARY_VIEW"],
  },
  {
    name: "Payroll Approver",
    code: "PAYROLL_APPROVER",
    department: "HR",
    riskLevel: 4,
    description: "Reviews and approves payroll processing and changes",
    conflictingRoles: ["PAYROLL_ADMIN"],
    permissions: ["PAYROLL_APPROVE", "PAYROLL_VIEW", "AUDIT_TRAIL"],
  },

  // Operations & Procurement Roles
  {
    name: "Procurement Specialist",
    code: "PROCUREMENT",
    department: "Procurement",
    riskLevel: 3,
    description: "Manages procurement processes and vendor relationships",
    conflictingRoles: ["VENDOR_ADMIN", "PO_APPROVER"],
    permissions: ["VENDOR_VIEW", "PO_CREATE", "CONTRACT_VIEW"],
  },
  {
    name: "Vendor Administrator",
    code: "VENDOR_ADMIN",
    department: "Procurement",
    riskLevel: 4,
    description: "Manages vendor master data and setup",
    conflictingRoles: ["AP_CLERK", "PAYMENT_APPROVER", "PROCUREMENT"],
    permissions: ["VENDOR_CREATE", "VENDOR_EDIT", "VENDOR_DELETE"],
  },
  {
    name: "Purchase Order Approver",
    code: "PO_APPROVER",
    department: "Operations",
    riskLevel: 3,
    description: "Reviews and approves purchase orders and requisitions",
    conflictingRoles: ["PROCUREMENT"],
    permissions: ["PO_APPROVE", "PO_VIEW", "BUDGET_VIEW"],
  },
  {
    name: "Operations Manager",
    code: "OPS_MANAGER",
    department: "Operations",
    riskLevel: 3,
    description: "Oversees operational processes and team management",
    conflictingRoles: [],
    permissions: ["OPERATION_VIEW", "REPORT_VIEW", "EMPLOYEE_MANAGE"],
  },
];

const employeeData: SeedEmployee[] = [
  // Finance Department (30 employees)
  {
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@company.com",
    department: "Finance",
    role: "CONTROLLER",
    manager: undefined,
  },
  {
    firstName: "Michael",
    lastName: "Chen",
    email: "michael.chen@company.com",
    department: "Finance",
    role: "PAYMENT_APPROVER",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Jennifer",
    lastName: "Williams",
    email: "jennifer.williams@company.com",
    department: "Finance",
    role: "AP_CLERK",
    manager: "Michael Chen",
  },
  {
    firstName: "David",
    lastName: "Brown",
    email: "david.brown@company.com",
    department: "Finance",
    role: "AR_CLERK",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Lisa",
    lastName: "Davis",
    email: "lisa.davis@company.com",
    department: "Finance",
    role: "JOURNAL_CLERK",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Robert",
    lastName: "Miller",
    email: "robert.miller@company.com",
    department: "Finance",
    role: "CASH_MGR",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Amanda",
    lastName: "Wilson",
    email: "amanda.wilson@company.com",
    department: "Finance",
    role: "BANK_RECONCILER",
    manager: "Sarah Johnson",
  },
  {
    firstName: "James",
    lastName: "Moore",
    email: "james.moore@company.com",
    department: "Finance",
    role: "AP_CLERK",
    manager: "Michael Chen",
  },
  {
    firstName: "Mary",
    lastName: "Taylor",
    email: "mary.taylor@company.com",
    department: "Finance",
    role: "PAYMENT_APPROVER",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Christopher",
    lastName: "Anderson",
    email: "christopher.anderson@company.com",
    department: "Finance",
    role: "AR_CLERK",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Patricia",
    lastName: "Thomas",
    email: "patricia.thomas@company.com",
    department: "Finance",
    role: "JOURNAL_CLERK",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Daniel",
    lastName: "Jackson",
    email: "daniel.jackson@company.com",
    department: "Finance",
    role: "AP_CLERK",
    manager: "Michael Chen",
  },
  {
    firstName: "Linda",
    lastName: "White",
    email: "linda.white@company.com",
    department: "Finance",
    role: "CASH_MGR",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Matthew",
    lastName: "Harris",
    email: "matthew.harris@company.com",
    department: "Finance",
    role: "BANK_RECONCILER",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Barbara",
    lastName: "Martin",
    email: "barbara.martin@company.com",
    department: "Finance",
    role: "AR_CLERK",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Anthony",
    lastName: "Thompson",
    email: "anthony.thompson@company.com",
    department: "Finance",
    role: "PAYMENT_APPROVER",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Susan",
    lastName: "Garcia",
    email: "susan.garcia@company.com",
    department: "Finance",
    role: "AP_CLERK",
    manager: "Michael Chen",
  },
  {
    firstName: "Kevin",
    lastName: "Martinez",
    email: "kevin.martinez@company.com",
    department: "Finance",
    role: "JOURNAL_CLERK",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Helen",
    lastName: "Robinson",
    email: "helen.robinson@company.com",
    department: "Finance",
    role: "CASH_MGR",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Brian",
    lastName: "Clark",
    email: "brian.clark@company.com",
    department: "Finance",
    role: "BANK_RECONCILER",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Betty",
    lastName: "Rodriguez",
    email: "betty.rodriguez@company.com",
    department: "Finance",
    role: "AR_CLERK",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Edward",
    lastName: "Lewis",
    email: "edward.lewis@company.com",
    department: "Finance",
    role: "AP_CLERK",
    manager: "Michael Chen",
  },
  {
    firstName: "Dorothy",
    lastName: "Lee",
    email: "dorothy.lee@company.com",
    department: "Finance",
    role: "PAYMENT_APPROVER",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Ronald",
    lastName: "Walker",
    email: "ronald.walker@company.com",
    department: "Finance",
    role: "JOURNAL_CLERK",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Sandra",
    lastName: "Hall",
    email: "sandra.hall@company.com",
    department: "Finance",
    role: "CASH_MGR",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Mark",
    lastName: "Allen",
    email: "mark.allen@company.com",
    department: "Finance",
    role: "BANK_RECONCILER",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Donna",
    lastName: "Young",
    email: "donna.young@company.com",
    department: "Finance",
    role: "AR_CLERK",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Steven",
    lastName: "Hernandez",
    email: "steven.hernandez@company.com",
    department: "Finance",
    role: "AP_CLERK",
    manager: "Michael Chen",
  },
  {
    firstName: "Carol",
    lastName: "King",
    email: "carol.king@company.com",
    department: "Finance",
    role: "PAYMENT_APPROVER",
    manager: "Sarah Johnson",
  },
  {
    firstName: "Joseph",
    lastName: "Wright",
    email: "joseph.wright@company.com",
    department: "Finance",
    role: "JOURNAL_CLERK",
    manager: "Sarah Johnson",
  },

  // IT Department (25 employees)
  {
    firstName: "Thomas",
    lastName: "Lopez",
    email: "thomas.lopez@company.com",
    department: "Information Technology",
    role: "SYSADMIN",
    manager: undefined,
  },
  {
    firstName: "Nancy",
    lastName: "Hill",
    email: "nancy.hill@company.com",
    department: "Information Technology",
    role: "USER_ADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Jason",
    lastName: "Scott",
    email: "jason.scott@company.com",
    department: "Information Technology",
    role: "DBA",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Karen",
    lastName: "Green",
    email: "karen.green@company.com",
    department: "Information Technology",
    role: "SECURITY_ADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Jeffrey",
    lastName: "Adams",
    email: "jeffrey.adams@company.com",
    department: "Information Technology",
    role: "USER_ADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Lisa",
    lastName: "Baker",
    email: "lisa.baker@company.com",
    department: "Information Technology",
    role: "DBA",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Frank",
    lastName: "Gonzalez",
    email: "frank.gonzalez@company.com",
    department: "Information Technology",
    role: "SYSADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Sharon",
    lastName: "Nelson",
    email: "sharon.nelson@company.com",
    department: "Information Technology",
    role: "SECURITY_ADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Gary",
    lastName: "Carter",
    email: "gary.carter@company.com",
    department: "Information Technology",
    role: "USER_ADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Michelle",
    lastName: "Mitchell",
    email: "michelle.mitchell@company.com",
    department: "Information Technology",
    role: "DBA",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Larry",
    lastName: "Perez",
    email: "larry.perez@company.com",
    department: "Information Technology",
    role: "SYSADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Kimberly",
    lastName: "Roberts",
    email: "kimberly.roberts@company.com",
    department: "Information Technology",
    role: "SECURITY_ADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Scott",
    lastName: "Turner",
    email: "scott.turner@company.com",
    department: "Information Technology",
    role: "USER_ADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Deborah",
    lastName: "Phillips",
    email: "deborah.phillips@company.com",
    department: "Information Technology",
    role: "DBA",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Timothy",
    lastName: "Campbell",
    email: "timothy.campbell@company.com",
    department: "Information Technology",
    role: "SYSADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Maria",
    lastName: "Parker",
    email: "maria.parker@company.com",
    department: "Information Technology",
    role: "SECURITY_ADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Jose",
    lastName: "Evans",
    email: "jose.evans@company.com",
    department: "Information Technology",
    role: "USER_ADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Laura",
    lastName: "Edwards",
    email: "laura.edwards@company.com",
    department: "Information Technology",
    role: "DBA",
    manager: "Thomas Lopez",
  },
  {
    firstName: "John",
    lastName: "Collins",
    email: "john.collins@company.com",
    department: "Information Technology",
    role: "SYSADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Ruth",
    lastName: "Stewart",
    email: "ruth.stewart@company.com",
    department: "Information Technology",
    role: "SECURITY_ADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Kenneth",
    lastName: "Sanchez",
    email: "kenneth.sanchez@company.com",
    department: "Information Technology",
    role: "USER_ADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Jessica",
    lastName: "Morris",
    email: "jessica.morris@company.com",
    department: "Information Technology",
    role: "DBA",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Paul",
    lastName: "Rogers",
    email: "paul.rogers@company.com",
    department: "Information Technology",
    role: "SYSADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "Sharon",
    lastName: "Reed",
    email: "sharon.reed@company.com",
    department: "Information Technology",
    role: "SECURITY_ADMIN",
    manager: "Thomas Lopez",
  },
  {
    firstName: "William",
    lastName: "Cook",
    email: "william.cook@company.com",
    department: "Information Technology",
    role: "USER_ADMIN",
    manager: "Thomas Lopez",
  },

  // HR Department (20 employees)
  {
    firstName: "Margaret",
    lastName: "Morgan",
    email: "margaret.morgan@company.com",
    department: "Human Resources",
    role: "HR_GENERALIST",
    manager: undefined,
  },
  {
    firstName: "Charles",
    lastName: "Bell",
    email: "charles.bell@company.com",
    department: "Human Resources",
    role: "PAYROLL_ADMIN",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Julie",
    lastName: "Murphy",
    email: "julie.murphy@company.com",
    department: "Human Resources",
    role: "PAYROLL_APPROVER",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Donald",
    lastName: "Bailey",
    email: "donald.bailey@company.com",
    department: "Human Resources",
    role: "HR_GENERALIST",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Cheryl",
    lastName: "Rivera",
    email: "cheryl.rivera@company.com",
    department: "Human Resources",
    role: "PAYROLL_ADMIN",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Arthur",
    lastName: "Cooper",
    email: "arthur.cooper@company.com",
    department: "Human Resources",
    role: "HR_GENERALIST",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Jean",
    lastName: "Richardson",
    email: "jean.richardson@company.com",
    department: "Human Resources",
    role: "PAYROLL_APPROVER",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Ralph",
    lastName: "Cox",
    email: "ralph.cox@company.com",
    department: "Human Resources",
    role: "HR_GENERALIST",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Kathryn",
    lastName: "Howard",
    email: "kathryn.howard@company.com",
    department: "Human Resources",
    role: "PAYROLL_ADMIN",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Harold",
    lastName: "Ward",
    email: "harold.ward@company.com",
    department: "Human Resources",
    role: "HR_GENERALIST",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Janice",
    lastName: "Torres",
    email: "janice.torres@company.com",
    department: "Human Resources",
    role: "PAYROLL_APPROVER",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Peter",
    lastName: "Peterson",
    email: "peter.peterson@company.com",
    department: "Human Resources",
    role: "HR_GENERALIST",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Virginia",
    lastName: "Gray",
    email: "virginia.gray@company.com",
    department: "Human Resources",
    role: "PAYROLL_ADMIN",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Jack",
    lastName: "Ramirez",
    email: "jack.ramirez@company.com",
    department: "Human Resources",
    role: "HR_GENERALIST",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Martha",
    lastName: "James",
    email: "martha.james@company.com",
    department: "Human Resources",
    role: "PAYROLL_APPROVER",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Carl",
    lastName: "Watson",
    email: "carl.watson@company.com",
    department: "Human Resources",
    role: "HR_GENERALIST",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Frances",
    lastName: "Brooks",
    email: "frances.brooks@company.com",
    department: "Human Resources",
    role: "PAYROLL_ADMIN",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Henry",
    lastName: "Kelly",
    email: "henry.kelly@company.com",
    department: "Human Resources",
    role: "HR_GENERALIST",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Joyce",
    lastName: "Sanders",
    email: "joyce.sanders@company.com",
    department: "Human Resources",
    role: "PAYROLL_APPROVER",
    manager: "Margaret Morgan",
  },
  {
    firstName: "Terry",
    lastName: "Price",
    email: "terry.price@company.com",
    department: "Human Resources",
    role: "HR_GENERALIST",
    manager: "Margaret Morgan",
  },

  // Operations & Procurement (25 employees)
  {
    firstName: "Billy",
    lastName: "Bennett",
    email: "billy.bennett@company.com",
    department: "Operations",
    role: "OPS_MANAGER",
    manager: undefined,
  },
  {
    firstName: "Gloria",
    lastName: "Wood",
    email: "gloria.wood@company.com",
    department: "Procurement",
    role: "VENDOR_ADMIN",
    manager: "Billy Bennett",
  },
  {
    firstName: "Wayne",
    lastName: "Barnes",
    email: "wayne.barnes@company.com",
    department: "Procurement",
    role: "PROCUREMENT",
    manager: "Billy Bennett",
  },
  {
    firstName: "Evelyn",
    lastName: "Ross",
    email: "evelyn.ross@company.com",
    department: "Operations",
    role: "PO_APPROVER",
    manager: "Billy Bennett",
  },
  {
    firstName: "Louis",
    lastName: "Henderson",
    email: "louis.henderson@company.com",
    department: "Procurement",
    role: "VENDOR_ADMIN",
    manager: "Billy Bennett",
  },
  {
    firstName: "Diane",
    lastName: "Coleman",
    email: "diane.coleman@company.com",
    department: "Procurement",
    role: "PROCUREMENT",
    manager: "Billy Bennett",
  },
  {
    firstName: "Bruce",
    lastName: "Jenkins",
    email: "bruce.jenkins@company.com",
    department: "Operations",
    role: "PO_APPROVER",
    manager: "Billy Bennett",
  },
  {
    firstName: "Alice",
    lastName: "Perry",
    email: "alice.perry@company.com",
    department: "Procurement",
    role: "VENDOR_ADMIN",
    manager: "Billy Bennett",
  },
  {
    firstName: "Willie",
    lastName: "Powell",
    email: "willie.powell@company.com",
    department: "Procurement",
    role: "PROCUREMENT",
    manager: "Billy Bennett",
  },
  {
    firstName: "Lois",
    lastName: "Long",
    email: "lois.long@company.com",
    department: "Operations",
    role: "OPS_MANAGER",
    manager: "Billy Bennett",
  },
  {
    firstName: "Eugene",
    lastName: "Patterson",
    email: "eugene.patterson@company.com",
    department: "Procurement",
    role: "VENDOR_ADMIN",
    manager: "Billy Bennett",
  },
  {
    firstName: "Jane",
    lastName: "Hughes",
    email: "jane.hughes@company.com",
    department: "Procurement",
    role: "PROCUREMENT",
    manager: "Billy Bennett",
  },
  {
    firstName: "Roy",
    lastName: "Flores",
    email: "roy.flores@company.com",
    department: "Operations",
    role: "PO_APPROVER",
    manager: "Billy Bennett",
  },
  {
    firstName: "Annie",
    lastName: "Washington",
    email: "annie.washington@company.com",
    department: "Procurement",
    role: "VENDOR_ADMIN",
    manager: "Billy Bennett",
  },
  {
    firstName: "Joe",
    lastName: "Butler",
    email: "joe.butler@company.com",
    department: "Procurement",
    role: "PROCUREMENT",
    manager: "Billy Bennett",
  },
  {
    firstName: "Rose",
    lastName: "Simmons",
    email: "rose.simmons@company.com",
    department: "Operations",
    role: "OPS_MANAGER",
    manager: "Billy Bennett",
  },
  {
    firstName: "Philip",
    lastName: "Foster",
    email: "philip.foster@company.com",
    department: "Procurement",
    role: "VENDOR_ADMIN",
    manager: "Billy Bennett",
  },
  {
    firstName: "Judy",
    lastName: "Gonzales",
    email: "judy.gonzales@company.com",
    department: "Procurement",
    role: "PROCUREMENT",
    manager: "Billy Bennett",
  },
  {
    firstName: "Johnny",
    lastName: "Bryant",
    email: "johnny.bryant@company.com",
    department: "Operations",
    role: "PO_APPROVER",
    manager: "Billy Bennett",
  },
  {
    firstName: "Theresa",
    lastName: "Alexander",
    email: "theresa.alexander@company.com",
    department: "Procurement",
    role: "VENDOR_ADMIN",
    manager: "Billy Bennett",
  },
  {
    firstName: "Gerald",
    lastName: "Russell",
    email: "gerald.russell@company.com",
    department: "Procurement",
    role: "PROCUREMENT",
    manager: "Billy Bennett",
  },
  {
    firstName: "Beverly",
    lastName: "Griffin",
    email: "beverly.griffin@company.com",
    department: "Operations",
    role: "OPS_MANAGER",
    manager: "Billy Bennett",
  },
  {
    firstName: "Albert",
    lastName: "Diaz",
    email: "albert.diaz@company.com",
    department: "Procurement",
    role: "VENDOR_ADMIN",
    manager: "Billy Bennett",
  },
  {
    firstName: "Marie",
    lastName: "Hayes",
    email: "marie.hayes@company.com",
    department: "Procurement",
    role: "PROCUREMENT",
    manager: "Billy Bennett",
  },
  {
    firstName: "Roger",
    lastName: "Myers",
    email: "roger.myers@company.com",
    department: "Operations",
    role: "PO_APPROVER",
    manager: "Billy Bennett",
  },
];

// Enhanced transaction actions with better distribution and amounts
const transactionActions = [
  // Accounts Payable Actions
  { action: "INVOICE_CREATE", category: "ACCOUNTS_PAYABLE", riskWeight: 2 },
  { action: "INVOICE_EDIT", category: "ACCOUNTS_PAYABLE", riskWeight: 2 },
  { action: "INVOICE_APPROVE", category: "ACCOUNTS_PAYABLE", riskWeight: 3 },
  { action: "VENDOR_CREATE", category: "VENDOR_MANAGEMENT", riskWeight: 4 },
  { action: "VENDOR_EDIT", category: "VENDOR_MANAGEMENT", riskWeight: 3 },
  { action: "VENDOR_DELETE", category: "VENDOR_MANAGEMENT", riskWeight: 5 },

  // Payment Processing
  { action: "PAYMENT_APPROVE", category: "PAYMENT_PROCESSING", riskWeight: 5 },
  { action: "PAYMENT_PROCESS", category: "PAYMENT_PROCESSING", riskWeight: 4 },
  { action: "PAYMENT_CANCEL", category: "PAYMENT_PROCESSING", riskWeight: 3 },

  // Journal Entries
  {
    action: "JOURNAL_ENTRY_CREATE",
    category: "JOURNAL_ENTRIES",
    riskWeight: 3,
  },
  { action: "JOURNAL_ENTRY_EDIT", category: "JOURNAL_ENTRIES", riskWeight: 3 },
  {
    action: "JOURNAL_ENTRY_APPROVE",
    category: "JOURNAL_ENTRIES",
    riskWeight: 4,
  },
  { action: "JOURNAL_ENTRY_POST", category: "JOURNAL_ENTRIES", riskWeight: 4 },

  // Cash Management
  { action: "CASH_MANAGEMENT", category: "CASH_MANAGEMENT", riskWeight: 4 },
  { action: "BANK_RECONCILIATION", category: "CASH_MANAGEMENT", riskWeight: 3 },
  { action: "CASH_TRANSFER", category: "CASH_MANAGEMENT", riskWeight: 4 },

  // Purchase Orders
  { action: "PURCHASE_ORDER_CREATE", category: "PROCUREMENT", riskWeight: 2 },
  { action: "PURCHASE_ORDER_APPROVE", category: "PROCUREMENT", riskWeight: 3 },
  { action: "PURCHASE_ORDER_MODIFY", category: "PROCUREMENT", riskWeight: 3 },

  // User Management
  { action: "USER_CREATE", category: "USER_MANAGEMENT", riskWeight: 4 },
  { action: "USER_EDIT", category: "USER_MANAGEMENT", riskWeight: 3 },
  { action: "USER_DELETE", category: "USER_MANAGEMENT", riskWeight: 5 },
  { action: "PERMISSION_ASSIGN", category: "USER_MANAGEMENT", riskWeight: 5 },
  { action: "ROLE_ASSIGN", category: "USER_MANAGEMENT", riskWeight: 4 },

  // Payroll
  { action: "PAYROLL_PROCESS", category: "PAYROLL", riskWeight: 4 },
  { action: "PAYROLL_APPROVE", category: "PAYROLL", riskWeight: 4 },
  { action: "PAYROLL_MODIFY", category: "PAYROLL", riskWeight: 3 },

  // System Administration
  { action: "SYSTEM_CONFIG", category: "SYSTEM_ADMIN", riskWeight: 5 },
  { action: "DATABASE_BACKUP", category: "SYSTEM_ADMIN", riskWeight: 3 },
  { action: "SECURITY_CONFIG", category: "SYSTEM_ADMIN", riskWeight: 5 },

  // Reporting
  { action: "REPORT_GENERATE", category: "REPORTING", riskWeight: 1 },
  { action: "REPORT_EXPORT", category: "REPORTING", riskWeight: 2 },
  { action: "AUDIT_VIEW", category: "REPORTING", riskWeight: 2 },
];

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  console.log("🧹 Cleaning existing data...");
  await prisma.violation.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.systemMetric.deleteMany({});

  // Create departments
  console.log("🏢 Creating departments...");
  const createdDepartments = await Promise.all(
    departments.map((dept) =>
      prisma.department.create({
        data: {
          name: dept.name,
          code: dept.code,
          description: dept.description,
          headCount: employeeData.filter((emp) => emp.department === dept.name)
            .length,
        },
      }),
    ),
  );

  // Create roles
  console.log("👥 Creating roles...");
  const createdRoles = await Promise.all(
    roles.map((role) =>
      prisma.role.create({
        data: {
          name: role.name,
          code: role.code,
          riskLevel: role.riskLevel,
          description: role.description,
          conflictingRoles: role.conflictingRoles,
          permissions: role.permissions,
        },
      }),
    ),
  );

  // Create employees
  console.log("👤 Creating employees...");
  const createdEmployees = await Promise.all(
    employeeData.map(async (empData, index) => {
      const department = createdDepartments.find(
        (d) => d.name === empData.department,
      );
      const role = createdRoles.find((r) => r.code === empData.role);

      if (!department || !role) {
        console.warn(
          `Skipping employee ${empData.firstName} ${empData.lastName} - missing department or role`,
        );
        return null;
      }

      return prisma.employee.create({
        data: {
          employeeId: `EMP${String(index + 1000).padStart(4, "0")}`,
          firstName: empData.firstName,
          lastName: empData.lastName,
          email: empData.email,
          departmentId: department.id,
          roleId: role.id,
          manager: empData.manager || null,
          startDate: new Date(
            Date.now() - Math.random() * 365 * 5 * 24 * 60 * 60 * 1000,
          ), // Random date within last 5 years
          isActive: true,
          riskScore: 1 + Math.random() * 4, // 1-5 risk score based on role and activity
        },
      });
    }),
  );

  const validEmployees = createdEmployees.filter((emp) => emp !== null);
  console.log(`✅ Created ${validEmployees.length} employees`);

  // Enhanced transaction generation with 50,000 transactions and wider amount ranges
  console.log("💼 Generating 50,000 transactions with enhanced diversity...");
  const transactions = [];
  const currentDate = new Date();
  const oneYearAgo = new Date(
    currentDate.getTime() - 365 * 24 * 60 * 60 * 1000,
  );

  // Generate IP addresses for variety
  const generateIP = () =>
    `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

  // Enhanced amount generation with wider ranges
  const generateTransactionAmount = (actionType: string) => {
    const rand = Math.random();

    if (
      [
        "PAYMENT_APPROVE",
        "PAYMENT_PROCESS",
        "CASH_MANAGEMENT",
        "CASH_TRANSFER",
      ].includes(actionType)
    ) {
      if (rand < 0.02) {
        // 2% ultra-high value transactions
        return 500000 + Math.random() * 2000000; // $500K - $2.5M
      } else if (rand < 0.08) {
        // 6% very high value
        return 100000 + Math.random() * 400000; // $100K - $500K
      } else if (rand < 0.2) {
        // 12% high value
        return 25000 + Math.random() * 75000; // $25K - $100K
      } else if (rand < 0.4) {
        // 20% medium-high value
        return 5000 + Math.random() * 20000; // $5K - $25K
      } else if (rand < 0.7) {
        // 30% medium value
        return 1000 + Math.random() * 4000; // $1K - $5K
      } else if (rand < 0.9) {
        // 20% low-medium value
        return 300 + Math.random() * 700; // $300 - $1K (these will be flagged with high materiality)
      } else {
        // 10% very small transactions
        return 50 + Math.random() * 250; // $50 - $300 (trivial amounts for testing)
      }
    } else if (["PAYROLL_PROCESS", "PAYROLL_APPROVE"].includes(actionType)) {
      // Payroll amounts - more realistic ranges
      if (rand < 0.05) {
        // 5% executive payroll
        return 200000 + Math.random() * 800000; // $200K - $1M
      } else if (rand < 0.2) {
        // 15% senior staff
        return 80000 + Math.random() * 120000; // $80K - $200K
      } else {
        // 80% regular payroll
        return 40000 + Math.random() * 40000; // $40K - $80K
      }
    } else if (
      ["PURCHASE_ORDER_APPROVE", "PURCHASE_ORDER_CREATE"].includes(actionType)
    ) {
      // Purchase orders with diverse amounts
      if (rand < 0.05) {
        // 5% large equipment/contracts
        return 50000 + Math.random() * 450000; // $50K - $500K
      } else if (rand < 0.15) {
        // 10% significant purchases
        return 10000 + Math.random() * 40000; // $10K - $50K
      } else if (rand < 0.4) {
        // 25% medium purchases
        return 2000 + Math.random() * 8000; // $2K - $10K
      } else if (rand < 0.75) {
        // 35% regular purchases
        return 500 + Math.random() * 1500; // $500 - $2K
      } else {
        // 25% small purchases (office supplies, etc.)
        return 25 + Math.random() * 475; // $25 - $500 (small amounts for materiality testing)
      }
    } else {
      // Other transactions - administrative, reporting, etc.
      if (rand < 0.1) {
        // 10% have monetary values
        return 100 + Math.random() * 2000; // $100 - $2,100
      } else {
        return null; // 90% are non-monetary administrative actions
      }
    }
  };

  console.log("📊 Generating transactions in batches...");
  // Allow overriding transaction volume for faster local/dev seeds via SEED_TX_COUNT env var
  const totalTransactionsEnv = process.env.SEED_TX_COUNT
    ? parseInt(process.env.SEED_TX_COUNT, 10)
    : undefined;
  const totalTransactions =
    Number.isFinite(totalTransactionsEnv) && (totalTransactionsEnv ?? 0) > 0
      ? (totalTransactionsEnv as number)
      : 50000; // default heavy seed
  if (totalTransactions !== 50000) {
    console.log(
      `⚙️  Using custom SEED_TX_COUNT=${totalTransactions} (default is 50000)`,
    );
  }
  const batchSize = 1000;

  for (
    let batch = 0;
    batch < Math.ceil(totalTransactions / batchSize);
    batch++
  ) {
    const batchTransactions = [];
    const startIdx = batch * batchSize;
    const endIdx = Math.min(startIdx + batchSize, totalTransactions);

    for (let i = startIdx; i < endIdx; i++) {
      // Random employee
      const employee =
        validEmployees[Math.floor(Math.random() * validEmployees.length)];
      if (!employee) continue;

      // Random timestamp within the last 12 months - ensure good distribution
      const randomTime =
        oneYearAgo.getTime() +
        Math.random() * (currentDate.getTime() - oneYearAgo.getTime());
      const timestamp = new Date(randomTime);

      // Get employee role to determine appropriate actions
      const employeeRole = createdRoles.find((r) => r.id === employee.roleId);
      const rolePermissions = employeeRole?.permissions ?? [];

      // Select action based on role permissions (80% of the time) or random (20% for violations)
      let selectedAction;
      if (Math.random() < 0.8 && rolePermissions.length > 0) {
        // Select action based on permissions
        const matchingActions = transactionActions.filter((ta) =>
          rolePermissions.some((perm) =>
            ta.action.includes(perm.split("_")[0] ?? ""),
          ),
        );
        selectedAction =
          matchingActions.length > 0
            ? matchingActions[
                Math.floor(Math.random() * matchingActions.length)
              ]
            : transactionActions[
                Math.floor(Math.random() * transactionActions.length)
              ];
      } else {
        // Random action (potential violation)
        selectedAction =
          transactionActions[
            Math.floor(Math.random() * transactionActions.length)
          ];
      }

      if (!selectedAction) continue;

      // Generate enhanced amounts with wider ranges
      const amount = generateTransactionAmount(selectedAction.action);

      batchTransactions.push({
        transactionId: `TXN${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, "0")}${String(i).padStart(6, "0")}`,
        employeeId: employee.id,
        action: selectedAction.action,
        category: selectedAction.category,
        amount: amount,
        description: `${selectedAction.action.replace(/_/g, " ").toLowerCase()} - ${employee.firstName} ${employee.lastName}`,
        systemId: `SYS${Math.floor(Math.random() * 999) + 1}`,
        ipAddress: generateIP(),
        timestamp: timestamp,
        metadata: {
          userAgent: "Enterprise-App/1.0",
          sessionId: `sess_${Math.random().toString(36).substring(2, 15)}`,
          riskWeight: selectedAction.riskWeight,
          quarter: `Q${Math.ceil((timestamp.getMonth() + 1) / 3)}`,
          fiscalYear: timestamp.getFullYear(),
        },
      });
    }

    // Create batch
    if (batchTransactions.length > 0) {
      await prisma.transaction.createMany({
        data: batchTransactions,
        skipDuplicates: true,
      });
      console.log(
        `   ✅ Created batch ${batch + 1}/${Math.ceil(totalTransactions / batchSize)} (${batchTransactions.length} transactions)`,
      );
    }
  }

  console.log(
    `✅ Created ${totalTransactions.toLocaleString()} transactions with enhanced amount diversity`,
  );

  // Generate intentional violations for demonstration
  console.log("🚨 Creating demonstration violations...");
  const violationTypes = [
    {
      type: "SOD_TEMPORAL",
      severity: "HIGH",
      description: "Same employee performed conflicting duties within 48 hours",
    },
    {
      type: "SOD_ROLE_CONFLICT",
      severity: "MEDIUM",
      description: "Employee has conflicting role assignments",
    },
    {
      type: "PRIVILEGE_ESCALATION",
      severity: "CRITICAL",
      description: "Employee performed actions beyond authorized permissions",
    },
    {
      type: "UNUSUAL_VOLUME",
      severity: "MEDIUM",
      description: "Employee transaction volume significantly above baseline",
    },
    {
      type: "TEMPORAL_ANOMALY",
      severity: "LOW",
      description: "Employee performing actions outside normal working hours",
    },
    {
      type: "MATERIALITY_BREACH",
      severity: "HIGH",
      description:
        "Transaction amount exceeds materiality thresholds without proper approval",
    },
  ];

  const demonstrationViolations = [];

  for (let i = 0; i < 75; i++) {
    // Increased to 75 violations for better demonstration
    const employee =
      validEmployees[Math.floor(Math.random() * validEmployees.length)];
    if (!employee) continue;

    const violationType =
      violationTypes[Math.floor(Math.random() * violationTypes.length)];
    if (!violationType) continue;

    const detectedDate = new Date(
      Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
    ); // Random date within last 90 days

    // Some violations are resolved, some are still open
    const isResolved = Math.random() < 0.65; // 65% resolved
    const resolvedDate = isResolved
      ? new Date(
          detectedDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000,
        ) // Resolved within 30 days
      : undefined;

    const status = isResolved
      ? Math.random() < 0.1
        ? "FALSE_POSITIVE"
        : "RESOLVED"
      : Math.random() < 0.3
        ? "INVESTIGATING"
        : "OPEN";

    demonstrationViolations.push({
      violationId: `VIO${Date.now()}${String(i).padStart(3, "0")}`,
      employeeId: employee.id,
      violationType: violationType.type,
      severity: violationType.severity,
      riskScore: 1 + Math.random() * 9, // 1-10 scale
      description: violationType.description,
      detectionMethod:
        Math.random() < 0.7 ? "STATISTICAL_ANOMALY" : "PATTERN_RECOGNITION",
      status: status,
      detectedAt: detectedDate,
      resolvedAt: resolvedDate,
      resolutionNotes: isResolved
        ? status === "FALSE_POSITIVE"
          ? "Determined to be normal business process"
          : "Issue addressed and resolved"
        : undefined,
      relatedTransactions: [], // Will be populated with actual transaction IDs
    });
  }

  await prisma.violation.createMany({
    data: demonstrationViolations,
    skipDuplicates: true,
  });

  console.log(
    `✅ Created ${demonstrationViolations.length} demonstration violations`,
  );

  // Generate system metrics for dashboard with 12-month history
  console.log("📈 Creating 12-month system metrics history...");
  const metrics = [];
  const metricCategories = ["COMPLIANCE", "RISK", "PERFORMANCE"];

  for (let days = 365; days >= 0; days--) {
    const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    metrics.push(
      {
        metricName: "CONTROL_EFFECTIVENESS_SCORE",
        metricValue: 75 + Math.random() * 20, // 75-95%
        metricUnit: "PERCENTAGE",
        category: "COMPLIANCE",
        recordedAt: date,
      },
      {
        metricName: "ACTIVE_VIOLATIONS",
        metricValue: 8 + Math.random() * 25, // 8-33 violations
        metricUnit: "COUNT",
        category: "RISK",
        recordedAt: date,
      },
      {
        metricName: "RISK_SCORE",
        metricValue: 2 + Math.random() * 6, // 2-8 risk score
        metricUnit: "SCORE",
        category: "RISK",
        recordedAt: date,
      },
      {
        metricName: "TRANSACTION_VOLUME",
        metricValue: 100 + Math.random() * 150, // 100-250 daily transactions
        metricUnit: "COUNT",
        category: "PERFORMANCE",
        recordedAt: date,
      },
    );
  }

  await prisma.systemMetric.createMany({
    data: metrics,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${metrics.length} system metrics over 12 months`);
  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`  • ${createdDepartments.length} Departments`);
  console.log(`  • ${createdRoles.length} Roles`);
  console.log(`  • ${validEmployees.length} Employees`);
  console.log(
    `  • ${totalTransactions.toLocaleString()} Transactions (with diverse $300-$2.5M amounts)`,
  );
  console.log(`  • ${demonstrationViolations.length} Violations`);
  console.log(`  • ${metrics.length} System Metrics (12-month history)`);
  console.log("\n✨ Enhanced features:");
  console.log("  • Wide transaction amount ranges for materiality testing");
  console.log("  • 12-month transaction date distribution");
  console.log("  • Small-value transactions ($300-500) for threshold testing");
  console.log("  • Comprehensive transaction categories and risk weights");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
