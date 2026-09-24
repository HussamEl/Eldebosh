/**
 * Live stream from the market stall (owner's decision, EB-035).
 *
 * An old Android phone on a stand streams to our YouTube channel. The site
 * holds one fixed link: YouTube opens the current live stream when there is
 * one, and the channel otherwise. No embed, no script, no cookies on our
 * pages — the site never needs to know whether we are live.
 *
 * Empty string hides the button.
 */
export const YOUTUBE_CHANNEL_ID = 'UC7bQJHL3CUyPjCmpSQOXA-g';

export const liveUrl = YOUTUBE_CHANNEL_ID
  ? `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}/live`
  : '';
