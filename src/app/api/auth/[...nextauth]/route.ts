import NextAuth from "next-auth"

const handler = NextAuth({
  providers: [],
  // Tambahkan provider di masa depan (misal: Credentials, Google)
})

export { handler as GET, handler as POST }
