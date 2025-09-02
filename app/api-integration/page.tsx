"use client";

import { useState } from "react";
import {
  Settings,
  Database,
  Shield,
  Zap,
  Code,
  Server,
  Lock,
  CheckCircle,
  ExternalLink,
  Copy,
  Globe,
  Layers,
  Activity,
  BarChart3,
} from "lucide-react";

export default function APIIntegration() {
  const [activeEndpoint, setActiveEndpoint] = useState("dashboard-stats");
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});

  const endpoints = [
    {
      id: "dashboard-stats",
      name: "Dashboard Statistics",
      method: "GET",
      path: "/api/dashboard/stats",
      description:
        "Retrieve comprehensive dashboard metrics including control effectiveness, violations, and compliance rates",
      response: {
        totalEmployees: 100,
        totalTransactions: 5000,
        activeViolations: 12,
        controlEffectivenessScore: 87.5,
        highRiskViolations: 4,
        avgResolutionTime: 18.5,
        complianceRate: 94.2,
        riskTrend: "STABLE",
      },
    },
    {
      id: "violations",
      name: "Violations Management",
      method: "GET",
      path: "/api/violations",
      description:
        "Fetch and filter SoD violations with pagination, severity filtering, and status management",
      parameters: [
        {
          name: "page",
          type: "integer",
          description: "Page number for pagination",
        },
        {
          name: "limit",
          type: "integer",
          description: "Number of results per page",
        },
        {
          name: "severity",
          type: "string",
          description: "Filter by severity: LOW, MEDIUM, HIGH, CRITICAL",
        },
        {
          name: "status",
          type: "string",
          description:
            "Filter by status: OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE",
        },
      ],
      response: {
        violations: [
          {
            id: "vio_123",
            violationId: "VIO-2024-001",
            violationType: "SOD_TEMPORAL",
            severity: "HIGH",
            riskScore: 7.5,
            status: "OPEN",
            employee: {
              firstName: "John",
              lastName: "Doe",
              department: { name: "Finance" },
            },
          },
        ],
        pagination: {
          page: 1,
          totalPages: 5,
          totalCount: 45,
        },
      },
    },
    {
      id: "sod-analysis",
      name: "SoD Analysis Engine",
      method: "POST",
      path: "/api/sod-analysis",
      description:
        "Perform real-time segregation of duties analysis for specific employees with statistical algorithms",
      requestBody: {
        employeeId: "emp_123",
        timeWindowHours: 72,
      },
      response: {
        employee: {
          name: "John Doe",
          riskScore: 6.8,
        },
        analysis: {
          riskScore: 7.2,
          temporalViolations: 2,
          patterns: ["Unusual transaction volume detected"],
          recommendations: ["Implement additional monitoring"],
        },
      },
    },
    {
      id: "analytics-trends",
      name: "Analytics & Trends",
      method: "GET",
      path: "/api/analytics/trends",
      description:
        "Generate trend analysis and statistical insights for violations, risk scores, and control effectiveness",
      parameters: [
        {
          name: "days",
          type: "integer",
          description: "Number of days for trend analysis (default: 30)",
        },
        {
          name: "metric",
          type: "string",
          description:
            "Metric type: violations, risk_scores, control_effectiveness",
        },
      ],
      response: {
        trendData: [
          { date: "2024-01-01", value: 5, label: "Jan 1" },
          { date: "2024-01-02", value: 3, label: "Jan 2" },
        ],
      },
    },
    {
      id: "risk-heatmap",
      name: "Risk Heatmap Data",
      method: "GET",
      path: "/api/analytics/risk-heatmap",
      description:
        "Department-level risk assessment data for visualization and reporting",
      response: {
        departments: [
          {
            department: "Finance",
            riskScore: 6.2,
            violationCount: 8,
            employeeCount: 30,
          },
          {
            department: "IT",
            riskScore: 4.1,
            violationCount: 3,
            employeeCount: 25,
          },
        ],
      },
    },
  ];

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopyStatus((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const selectedEndpoint = endpoints.find((ep) => ep.id === activeEndpoint);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              API Integration Overview
            </h1>
            <p className="text-green-100 text-lg">
              Enterprise-grade API architecture for seamless financial controls
              integration
            </p>
          </div>
          <div className="text-right">
            <p className="text-green-100 text-sm">API Version</p>
            <p className="text-white font-semibold">v1.0.0</p>
          </div>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Data Layer</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• PostgreSQL database with Prisma ORM</li>
            <li>• Real-time transaction monitoring</li>
            <li>• Historical data retention (3+ years)</li>
            <li>• Automated data validation & integrity checks</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Processing Engine
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Statistical anomaly detection algorithms</li>
            <li>• Real-time SoD violation analysis</li>
            <li>• Risk scoring & pattern recognition</li>
            <li>• Configurable business rules engine</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Security & Compliance
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• OAuth 2.0 / JWT authentication</li>
            <li>• Role-based access control (RBAC)</li>
            <li>• SOX compliance monitoring</li>
            <li>• Comprehensive audit trails</li>
          </ul>
        </div>
      </div>

      {/* Integration Features */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Layers className="h-6 w-6 mr-2 text-green-600" />
            Enterprise Integration Capabilities
          </h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <Server className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    ERP System Integration
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Seamless integration with SAP, Oracle, NetSuite, and other
                    enterprise systems via REST APIs
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Activity className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    Real-time Monitoring
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Continuous transaction monitoring with sub-second latency
                    for immediate violation detection
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <BarChart3 className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    Advanced Analytics
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Machine learning algorithms for predictive risk assessment
                    and behavioral analysis
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <Globe className="h-5 w-5 text-indigo-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    Multi-tenant Architecture
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Scalable cloud-native design supporting multiple business
                    units and subsidiaries
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Lock className="h-5 w-5 text-red-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    Enterprise Security
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    End-to-end encryption, VPN support, and compliance with SOX,
                    GDPR, and industry standards
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    Audit-Ready Reporting
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Pre-built reports for external auditors with complete audit
                    trail documentation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Documentation */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Code className="h-6 w-6 mr-2 text-green-600" />
            API Documentation & Endpoints
          </h3>
        </div>

        <div className="flex">
          {/* Endpoint Sidebar */}
          <div className="w-80 border-r border-gray-200 p-4">
            <div className="space-y-2">
              {endpoints.map((endpoint) => (
                <button
                  key={endpoint.id}
                  onClick={() => setActiveEndpoint(endpoint.id)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                    activeEndpoint === endpoint.id
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{endpoint.name}</span>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        endpoint.method === "GET"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {endpoint.method}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">
                    {endpoint.path}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Endpoint Details */}
          <div className="flex-1 p-6">
            {selectedEndpoint && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span
                      className={`px-3 py-1 text-sm rounded font-medium ${
                        selectedEndpoint.method === "GET"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {selectedEndpoint.method}
                    </span>
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                      {selectedEndpoint.path}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          selectedEndpoint.path,
                          selectedEndpoint.id,
                        )
                      }
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {copyStatus[selectedEndpoint.id] ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {selectedEndpoint.description}
                  </p>
                </div>

                {selectedEndpoint.parameters && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Parameters
                    </h4>
                    <div className="space-y-2">
                      {selectedEndpoint.parameters.map((param) => (
                        <div
                          key={param.name}
                          className="border border-gray-200 rounded-lg p-3"
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <code className="text-sm font-mono text-blue-600">
                              {param.name}
                            </code>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {param.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {param.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEndpoint.requestBody && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Request Body
                    </h4>
                    <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm font-mono overflow-x-auto">
                      {JSON.stringify(selectedEndpoint.requestBody, null, 2)}
                    </pre>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      Example Response
                    </h4>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(selectedEndpoint.response, null, 2),
                          `${selectedEndpoint.id}-response`,
                        )
                      }
                      className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
                    >
                      {copyStatus[`${selectedEndpoint.id}-response`] ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm font-mono overflow-x-auto">
                    {JSON.stringify(selectedEndpoint.response, null, 2)}
                  </pre>
                </div>

                {/* Try It Out Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Try It Out</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    Test this endpoint directly in your browser or API client:
                  </p>
                  <code className="bg-white border border-blue-300 rounded px-3 py-2 text-sm font-mono block">
                    curl -X {selectedEndpoint.method} "http://localhost:3000
                    {selectedEndpoint.path}"
                  </code>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integration Guide */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Settings className="h-6 w-6 mr-2 text-green-600" />
            Quick Integration Guide
          </h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                Getting Started
              </h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800">
                      Authentication Setup
                    </h5>
                    <p className="text-sm text-gray-600">
                      Configure API key or OAuth 2.0 credentials for secure
                      access
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800">
                      Webhook Configuration
                    </h5>
                    <p className="text-sm text-gray-600">
                      Set up real-time notifications for violation alerts and
                      status updates
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800">Data Mapping</h5>
                    <p className="text-sm text-gray-600">
                      Map your ERP system fields to FinanceGuard data schema
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800">
                      Testing & Validation
                    </h5>
                    <p className="text-sm text-gray-600">
                      Validate integration with test environment before
                      production deployment
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                Technical Requirements
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Protocol Support:</span>
                  <span className="font-medium">HTTPS, REST API, GraphQL</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Authentication:</span>
                  <span className="font-medium">OAuth 2.0, API Keys, JWT</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Rate Limits:</span>
                  <span className="font-medium">1000 req/min (standard)</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Response Format:</span>
                  <span className="font-medium">JSON, XML</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Webhook Support:</span>
                  <span className="font-medium">Yes (HTTPS endpoints)</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">SDK Availability:</span>
                  <span className="font-medium">Python, JavaScript, Java</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
