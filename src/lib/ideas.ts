/**
 * Project ideas for the Projects page: a generator that deals one part from each list,
 * and a short shelf of ready-made ideas covering every kind of project that counts.
 */

export interface Setting {
  text: string;
  /** How the place reads in a title: "The Echo on the Last Train". */
  title: string;
}

export const SETTINGS: Setting[] = [
  { text: "A 24-hour laundromat at 3am", title: "in the Laundromat" },
  { text: "The last train home, and it isn't stopping", title: "on the Last Train" },
  { text: "Your grandma's house, but every hallway is longer", title: "in the Long Hallway" },
  { text: "A closed-down mall with the music still on", title: "in the Dead Mall" },
  { text: "A lighthouse with no keeper", title: "at the Lighthouse" },
  { text: "A school after the lights go off", title: "in the Night School" },
  { text: "A drive-thru that only opens after midnight", title: "at the Drive-Thru" },
  { text: "A submarine that lost contact an hour ago", title: "on the Submarine" },
  { text: "A corn maze that keeps changing", title: "in the Corn Maze" },
  { text: "An apartment where the neighbour won't stop knocking", title: "in Apartment 4B" },
  { text: "A ski lodge snowed in for the night", title: "at the Lodge" },
  { text: "A hospital floor that isn't on the elevator buttons", title: "on the Missing Floor" },
];

export interface Threat {
  text: string;
  name: string;
}

export const THREATS: Threat[] = [
  { text: "Something that only moves when you blink", name: "Blinker" },
  { text: "A voice that copies yours", name: "Echo" },
  { text: "A mannequin that's never where you left it", name: "Mannequin" },
  { text: "A shadow with too many fingers", name: "Shadow" },
  { text: "A phone ringing from inside the walls", name: "Caller" },
  { text: "A friend who came back wrong", name: "Guest" },
  { text: "Something tall, standing just outside the light", name: "Tall One" },
  { text: "The same smile on every TV screen", name: "Smile" },
  { text: "Footsteps that stop when yours do", name: "Footsteps" },
  { text: "A doll that wants one more game", name: "Doll" },
  { text: "Something living in the vents", name: "Thing" },
];

export const MECHANICS: string[] = [
  "You can only see by camera flash",
  "Every sound you make shows up on a map it can read",
  "Your flashlight battery is your health",
  "You can't run, only hold your breath",
  "You hide by closing your eyes, and so does the screen",
  "You trade memories for light",
  "Doors only open if you knock the right number of times",
  "You only see it through security cameras",
  "The whole game is a chat you answer one message at a time",
  "You have one match. Then another. Then none",
];

export const TWISTS: string[] = [
  "The save point is lying to you",
  "You've played this night before",
  "The thing chasing you is trying to warn you",
  "The tutorial voice is the monster",
  "Every time you die, the place remembers",
  "It's the monster's first night too",
  "The exit was behind you the whole time",
  "Your reflection is a second slow",
  "The credits roll halfway through",
  "Someone else is playing at the same time",
];

/** One deal from the generator: an index into each list. */
export type Roll = [setting: number, threat: number, mechanic: number, twist: number];
export const PARTS = [SETTINGS, THREATS, MECHANICS, TWISTS] as const;

export function describe([s, t, m, w]: Roll) {
  const setting = SETTINGS[s]!;
  const threat = THREATS[t]!;
  return {
    title: `The ${threat.name} ${setting.title}`,
    pitch: `${setting.text}. ${threat.text}. ${MECHANICS[m]}. ${TWISTS[w]}.`,
  };
}

export type IdeaKind = "Game" | "Website" | "Costume";

export interface Idea {
  kind: IdeaKind;
  title: string;
  pitch: string;
  /** How big it is, so nobody picks a three-month idea with three weeks left. */
  size: string;
}

export const IDEAS: Idea[] = [
  {
    kind: "Game",
    title: "Night Shift",
    pitch: "Watch five cameras in a closed toy store until 6am. One of the bears is new.",
    size: "One room",
  },
  {
    kind: "Game",
    title: "Two Flights Down",
    pitch: "Walk down a stairwell. Every floor is a little more wrong than the one above it.",
    size: "One mechanic",
  },
  {
    kind: "Game",
    title: "New Voicemail",
    pitch: "A horror story told only through voicemails you play back, in whatever order you dare.",
    size: "Text and audio",
  },
  {
    kind: "Website",
    title: "Keep Scrolling",
    pitch: "A page that gets worse the further down you go, and remembers you when you come back.",
    size: "One page",
  },
  {
    kind: "Website",
    title: "Page Not Found",
    pitch: "A 404 page that won't let you leave. The back button is in on it.",
    size: "A weekend",
  },
  {
    kind: "Costume",
    title: "Hollow Eyes",
    pitch: "A mask with LED eyes that slowly turn to follow the nearest person in the room.",
    size: "LED costume",
  },
];
