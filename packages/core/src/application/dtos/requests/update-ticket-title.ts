export class UpdateTicketTitleRequest {
  constructor(
    public readonly id: string,
    public readonly newTitle: string
  ) {}
}
