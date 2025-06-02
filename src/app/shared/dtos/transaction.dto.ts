export interface TransactionDto {
  communication: string;

  amount: number;

  senderGroup?: number;

  senderPrincipal?: number;

  recipientGroup?: number[] ;

  recipientPrincipal?: number[];

  invoice_id?: number;

}
