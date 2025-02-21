// RaffleClientError.ts
export class RaffleClientError extends Error {
    constructor(message: string, originalError?: Error) {
        super(message);
        this.name = 'RaffleClientError';
        if (originalError) {
            this.stack += '\nCaused by: ' + originalError.stack;
        }
    }
}

export class SetRaffleEntrantsError extends RaffleClientError {
    constructor(originalError?: Error) {
        super('Error setting raffle entrants', originalError);
        this.name = 'SetRaffleEntrantsError';
    }
}

export class PullRaffleError extends RaffleClientError {
    constructor(originalError?: Error) {
        super('Error pulling raffle', originalError);
        this.name = 'PullRaffleError';
    }
}

export class ViewPullsError extends RaffleClientError {
    constructor(originalError?: Error) {
        super('Error viewing raffle pulls', originalError);
        this.name = 'ViewPullsError';
    }
}

export class ViewPullError extends RaffleClientError {
    constructor(originalError?: Error) {
        super('Error viewing raffle pull', originalError);
        this.name = 'ViewPullError';
    }
}
