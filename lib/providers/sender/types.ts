export type PushPitchInput = {
  pitchId: string;
  subject: string;
  body: string;
  toEmail?: string;
};

export type PushPitchResult = {
  externalId: string;
};

export type PitchReply = {
  externalId: string;
  repliedAt: string;
};

export interface SenderProvider {
  pushPitch(input: PushPitchInput): Promise<PushPitchResult>;
  getReplies(): Promise<PitchReply[]>;
}
