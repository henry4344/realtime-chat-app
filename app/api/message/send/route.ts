import { fetchRedis } from "@/app/helpers/redis";
import { authOptions } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { timeStamp } from "console";
import { getServerSession } from "next-auth";
import { nanoid } from "nanoid";
import { Message, messageValidator } from "@/app/lib/validations/message";

export async function POST(req: Request) {
  try {
    const { text, chatId } = await req.json();
    const session = await getServerSession(authOptions);

    if (!session) return new Response("Unauthorised", { status: 401 });

    const [userId1, userId2] = chatId.split("--");

    if (session.user.id !== userId1 && session.user.id !== userId2)
      return new Response("Unauthorised", { status: 401 });

    const friendId = session.user.id === userId1 ? userId2 : userId1;

    const friendList = (await fetchRedis(
      "smembers",
      `user:${session.user.id}:friends`
    )) as string[];

    const isFriend = friendList.includes(friendId);

    if (!isFriend) return new Response("Unauthorised", { status: 401 });

    const rawSender = (await fetchRedis(
      "get",
      `user:${session.user.id}`
    )) as string;
    const sender = JSON.parse(rawSender) as User;

    const timestamp = Date.now();

    const messageData: Message = {
      id: nanoid(),
      senderId: session.user.id,
      text,
      timestamp,
    };
    const message = messageValidator.parse(messageData);

    // all valid, send the message
    await db.zadd(`chat:${chatId}:messages`, {
      score: timestamp, //this is the order identifier
      member: JSON.stringify(message),
    });

    return new Response("OK");
  } catch (error) {
    if (error instanceof Error)
      return new Response(error.message, { status: 500 });

    return new Response("Internal server error", { status: 500 });
  }
}
