import { Tags } from "../../../core";
import { GetAllMessagesByRecipientParams } from "../../messages";

/**
 * Parameters for retrieving all credit notices
 */
export interface GetAllCreditNoticesParams extends Omit<GetAllMessagesByRecipientParams, "owner" | "tags"> {
    /** Optional additional tags to filter by */
    additionalTags?: Tags;
}

/**
 * Represents a credit notice with essential fields extracted from an Arweave transaction
 */
export interface CreditNotice {
    /** Unique identifier of the credit notice */
    id: string;
    /** Address of the recipient */
    recipient: string;
    /** Quantity of credits being transferred */
    quantity: string;
    /** Address of the sender */
    sender: string;
    /** Process ID that sent the credit notice */
    fromProcess: string;
    /** Timestamp of the block this transaction was included in */
    blockTimeStamp: number | undefined;
}
