export class DeleteTicketResponse {
  constructor(
    public readonly success: boolean,
    public readonly deletedId: string
  ) {}

  static success(deletedId: string): DeleteTicketResponse {
    return new DeleteTicketResponse(true, deletedId)
  }
}
