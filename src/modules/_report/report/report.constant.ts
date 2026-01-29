export enum TReportType {
  alarmPatrol = 'alarmPatrol',
  patrolReport = 'patrolReport',
  service = 'service',
  emergency_call_out = 'mast_relocation_report', //🆕
  // previously emergency_call_out .. now 
}

export enum TIncidentSevearity {
  low = 'low',
  medium = 'medium',
  high = 'high',
}

export enum TStatus {
  accept = 'accept',
  deny = 'deny',
  underReview = 'underReview'
}