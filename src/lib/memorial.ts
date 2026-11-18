export function isMemorialPortrait(notice: { kind: string; is_memorial: boolean; image_url: string | null }): boolean {
  return notice.kind === "event" && notice.is_memorial && Boolean(notice.image_url);
}