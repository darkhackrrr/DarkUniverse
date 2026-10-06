import { pick } from "./random";

export const EIGHT_BALL = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes — definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful.",
];

export const ROASTS = [
  "You're the reason the train keeps leaving without you.",
  "I'd agree with you, but then we'd both be wrong.",
  "You bring everyone so much joy… when you leave the room.",
  "Your GitHub contributions look like a flatline.",
  "You run on 1% battery and 100% audacity.",
  "Somewhere out there is a trophy for your achievements — and it's gathering dust.",
  "You're not stupid, you just have bad luck with thinking.",
  "If confidence were a currency, you'd still be in debt.",
  "You're like a software update — nobody asked, everybody ignores.",
  "Your middle name must be 'Warranty Void'.",
  "You put the 'pro' in procrastinate.",
  "You're the human version of a 404 page.",
  "You glow different — like a warning light.",
  "Your life story would be a great horror movie: nobody survives the plot.",
  "Even your autocorrect gives up on you.",
];

export const JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "I told my computer I needed a break — now it won't stop sending me KitKat ads.",
  "Why was the JavaScript developer sad? Because he didn't Node how to Express himself.",
  "A SQL query walks into a bar, approaches two tables and asks: 'May I join you?'",
  "Why do Java developers wear glasses? Because they don't C#.",
  "There are 10 types of people: those who understand binary and those who don't.",
  "I would tell you a UDP joke, but you might not get it.",
  "What's a compiler's favorite snack? Cookie cutters.",
  "Why did the developer go broke? Because he used up all his cache.",
  "Parallel lines have so much in common. It's a shame they'll never meet.",
  "I have a joke about time travel, but you didn't like it.",
  "Why did the scarecrow get promoted? He was outstanding in his field.",
  "What do you call a fake noodle? An impasta.",
  "Why don't scientists trust atoms? Because they make up everything.",
  "I'm reading a book about anti-gravity — it's impossible to put down.",
];

export const TRUTHS = [
  "What's the last thing you searched for in incognito mode?",
  "What's your most embarrassing autocorrect fail?",
  "Who was your first crush in school?",
  "What's the worst lie you've ever told to get out of homework?",
  "What's the longest you've gone without showering?",
  "What's a song you secretly love but would never admit?",
  "What's the last thing you cried about?",
  "Have you ever read your own old messages and cringed? Be honest.",
  "What's your biggest irrational fear?",
  "What's the pettiest reason you've been mad at someone?",
  "What's your most useless talent?",
  "What's something you pretend to understand but don't?",
];

export const DARES = [
  "Send your last saved screenshot (family friendly please).",
  "Change your status to 'I eat crayons' for the next 10 minutes.",
  "Do your best impression of the last YouTuber you watched.",
  "Let the next person in chat pick your nickname for an hour.",
  "Type your next 3 messages with your elbows.",
  "Sing the chorus of the last song in your playlist.",
  "Post a selfie with the 😶 emoji face.",
  "Say 'I am the Senate' in voice chat right now.",
  "Let someone in chat choose your status message.",
  "Do 10 jumping jacks and report back.",
  "Speak only in emoji until your next turn.",
  "Confess your most used emoji.",
];

export function randomChoice<T>(arr: readonly T[]): T {
  return pick(arr);
}
