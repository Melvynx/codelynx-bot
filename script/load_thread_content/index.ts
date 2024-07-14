import { PrismaClient } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function main() {

  const start = Date.now();

  const prisma = new PrismaClient();

  const threads = await prisma.xThread.findMany({
    select: {
      posts: true,
      id: true,
      fullContent: true,
    },
  });


  let i = 0;
  let lastPercent = -1;
  for (const thread of threads) {
    if (thread.fullContent !== "") {
      continue;
    }

    let content = "";
    for (const post of thread.posts.sort((a, b) => a.createAt.getDate() - b.createAt.getDate())) {
      content += post.content + ";\n;";
    }

    await prisma.xThread.update({
      where: { id: thread.id },
      data: { fullContent: content },
    });

    i++;
    const percent = Math.floor((i / threads.length) * 100);
    if (percent > lastPercent) {
      lastPercent = percent;
      console.log(`updating threads ${percent}%... (${i}/${threads.length})`);
    }
  }

  console.log(`FINISHED in ${Math.round((Date.now() - start) / 1000)}s`);
}

void main();