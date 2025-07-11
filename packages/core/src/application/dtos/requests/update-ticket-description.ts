export class UpdateTicketDescriptionRequest {
  constructor(
    public readonly id: string,
    public readonly newDescription: string
  ) {}
}
