export interface ProviderVDFResult {
    request_id: string;
    provider_id: string;
    input_value: string;
    modulus_value: string;
    output_value: string;
    proof: string;
    created_at: number;
};


export interface RandomRequest {
    request_id: string;
    requester: string;
    callback_id: string;
    providers: string;
    requested_inputs: number;
    status: string;
    entropy: string;
    created_at: number;
};

export interface ProviderVDFResults {
    requestResponses: ProviderVDFResult[];
};


export interface GetProviderAvailableValuesResponse {
    providerId: string;
    availibleRandomValues: number;
};

export interface GetUserInfoResponse {
    user_id: string;
    balance: number;
    created_at: number;
};

export interface RequestList {
    request_ids: string[];
};

export interface GetOpenRandomRequestsResponse {
    providerId: string;
    activeChallengeRequests: RequestList;
    activeOutputRequests: RequestList;
};



export interface RandomRequestResponse {
    randomRequest: RandomRequest;
    providerVDFResults: ProviderVDFResults;
};

export interface GetRandomRequestsResponse {
    randomRequestResponses: RandomRequestResponse[];
};

export interface SystemSpecs {
    arch: string;
    uptime: number;
    cpuCount: number;
    memoryTotalBytes: number;
    token: string;
}

export interface PerformanceMetrics {
    loadAverage: number[];
    memoryUsedPercent: number;
    diskUsedPercent: number;
    network: {
        rx_sec: number;
        tx_sec: number;
    };
}

export interface ExecutionMetrics {
    stepTimingsMs: Record<string, number>;
}

export interface HealthStatus {
    errorTotal: number;
    errorsLastHour: number;
    errorsLastDay: number;
    status: "healthy" | "degraded";
}

export interface MonitoringData {
    providerVersion: string;
    timestamp: string;
    systemSpecs: SystemSpecs;
    performance: PerformanceMetrics;
    executionMetrics: ExecutionMetrics;
    health: HealthStatus;
}

export interface ProviderActivity {
    active_challenge_requests: RequestList,
    provider_id: string,
    active: number,
    created_at: number,
    random_balance: number,
    active_output_requests: RequestList,
    provider_info?: string | MonitoringData,
	fulfillment_rewards: number,
    staked: 1
}

/**
 * Note the timing parameter in this TimeLockPuzzle is ommitted as this is a constant component of the protocol.
 * @inline 
 */
export interface TimeLockPuzzle {
    /**
     * The timelock puzzle input base64 (no 0x)
     */
    input: string
    /**
     * The timelock puzzle modulus base64 (no 0x)
     */
    modulus: string
}
/**
 * p*q = N
 * @inline 
 */
export interface RSAKey {
    /**
     * base64 (no 0x)
     */
    p: string,
    /**
     * base64 (no 0x)
     */
    q: string
}
