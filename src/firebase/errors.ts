// A custom error type for Firestore permission errors with added context.

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify({
        path: context.path,
        method: context.operation,
        request_resource_data: context.requestResourceData,
    }, null, 2)}`;
    
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
  }
}
