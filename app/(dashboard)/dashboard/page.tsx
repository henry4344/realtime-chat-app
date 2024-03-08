import { FC } from "react";
import Button from "../../components/ui/Button";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

interface pageProps {}

const page = async ({}) => {
  const session = await getServerSession(authOptions);

  return <p>Dashboard</p>;
};

export default page;
