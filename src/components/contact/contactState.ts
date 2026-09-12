export type ContactState = 'idle' | 'email' | 'phone';
export type ContactTarget = Exclude<ContactState, 'idle'>;
export const contactValues = { email: '18379022106@163.com', phone: '18379022106' } as const;

export function resolveContactState(focus: ContactTarget | null, touch: ContactTarget | null, hover: ContactTarget | null): ContactState {
  return touch ?? focus ?? hover ?? 'idle';
}
