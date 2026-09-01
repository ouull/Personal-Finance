import { db } from "@/lib/db";

export class TransactionError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "TransactionError";
  }
}

export async function createTransaction(userId: string, parsed: any) {
  return await db.$transaction(async (tx: any) => {
    // 1. Check account ownership if providing accounts
    if (parsed.sourceAccountId) {
      const sourceAcc = await tx.account.findUnique({
        where: { id: parsed.sourceAccountId },
      });
      if (!sourceAcc || sourceAcc.userId !== userId)
        throw new TransactionError(
          "UNAUTHORIZED",
          "Unauthorized source account",
        );

      if (
        (parsed.type === "EXPENSE" || parsed.type === "TRANSFER") &&
        Number(sourceAcc.balance) < parsed.amount
      ) {
        throw new TransactionError(
          "INSUFFICIENT_BALANCE",
          "Insufficient balance",
        );
      }
    }
    if (parsed.destinationAccountId) {
      const destAcc = await tx.account.findUnique({
        where: { id: parsed.destinationAccountId },
      });
      if (!destAcc || destAcc.userId !== userId)
        throw new TransactionError(
          "UNAUTHORIZED",
          "Unauthorized destination account",
        );
    }

    // 1.5. Validate Category Type Matches Transaction Type
    if (
      parsed.categoryId &&
      (parsed.type === "INCOME" || parsed.type === "EXPENSE")
    ) {
      const category = await tx.category.findUnique({
        where: { id: parsed.categoryId },
      });
      if (!category || category.userId !== userId)
        throw new TransactionError("UNAUTHORIZED", "Unauthorized category");
      if (category.type !== parsed.type) {
        throw new TransactionError(
          "CATEGORY_TYPE_MISMATCH",
          "category_type_mismatch",
        );
      }
    }

    // 1.7. Resolve Merchant from Name
    let finalMerchantId = parsed.merchantId;
    if (parsed.merchantName && parsed.merchantName.trim() !== "") {
      const merchantSearchName = parsed.merchantName.trim();
      const existingMerchant = await tx.merchant.findFirst({
        where: {
          userId,
          name: {
            equals: merchantSearchName,
            mode: "insensitive",
          },
        },
      });

      if (existingMerchant) {
        finalMerchantId = existingMerchant.id;
      } else {
        const newMerchant = await tx.merchant.create({
          data: {
            userId,
            name: merchantSearchName,
          },
        });
        finalMerchantId = newMerchant.id;
      }
    }

    // 2. Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: parsed.type,
        amount: parsed.amount,
        date: parsed.date,
        description: parsed.description,
        notes: parsed.notes,
        categoryId: parsed.categoryId,
        merchantId: finalMerchantId,
        sourceAccountId: parsed.sourceAccountId,
        destinationAccountId: parsed.destinationAccountId,
      },
    });

    // 3. Update account balances based on transaction type
    if (
      (parsed.type === "INCOME" || parsed.type === "INITIAL_BALANCE") &&
      parsed.destinationAccountId
    ) {
      await tx.account.update({
        where: { id: parsed.destinationAccountId },
        data: { balance: { increment: parsed.amount } },
      });
    } else if (parsed.type === "EXPENSE" && parsed.sourceAccountId) {
      await tx.account.update({
        where: { id: parsed.sourceAccountId },
        data: { balance: { decrement: parsed.amount } },
      });
    } else if (
      parsed.type === "TRANSFER" &&
      parsed.sourceAccountId &&
      parsed.destinationAccountId
    ) {
      await tx.account.update({
        where: { id: parsed.sourceAccountId },
        data: { balance: { decrement: parsed.amount } },
      });
      await tx.account.update({
        where: { id: parsed.destinationAccountId },
        data: { balance: { increment: parsed.amount } },
      });
    }

    return transaction;
  });
}

export async function updateTransaction(
  userId: string,
  id: string,
  parsed: any,
) {
  return await db.$transaction(async (tx: any) => {
    // 1. Fetch original transaction and check ownership
    const originalTx = await tx.transaction.findUnique({ where: { id } });
    if (!originalTx || originalTx.userId !== userId)
      throw new TransactionError("UNAUTHORIZED", "Unauthorized transaction");

    // Check account ownerships for new data
    if (parsed.sourceAccountId) {
      const sourceAcc = await tx.account.findUnique({
        where: { id: parsed.sourceAccountId },
      });
      if (!sourceAcc || sourceAcc.userId !== userId)
        throw new TransactionError(
          "UNAUTHORIZED",
          "Unauthorized source account",
        );
    }
    if (parsed.destinationAccountId) {
      const destAcc = await tx.account.findUnique({
        where: { id: parsed.destinationAccountId },
      });
      if (!destAcc || destAcc.userId !== userId)
        throw new TransactionError(
          "UNAUTHORIZED",
          "Unauthorized destination account",
        );
    }

    // 1.5. Validate Category Type Matches Transaction Type
    if (
      parsed.categoryId &&
      (parsed.type === "INCOME" || parsed.type === "EXPENSE")
    ) {
      const category = await tx.category.findUnique({
        where: { id: parsed.categoryId },
      });
      if (!category || category.userId !== userId)
        throw new TransactionError("UNAUTHORIZED", "Unauthorized category");
      if (category.type !== parsed.type) {
        throw new TransactionError(
          "CATEGORY_TYPE_MISMATCH",
          "category_type_mismatch",
        );
      }
    }

    // 2. Reverse original financial effects
    if (
      (originalTx.type === "INCOME" || originalTx.type === "INITIAL_BALANCE") &&
      originalTx.destinationAccountId
    ) {
      await tx.account.update({
        where: { id: originalTx.destinationAccountId },
        data: { balance: { decrement: originalTx.amount } },
      });
    } else if (originalTx.type === "EXPENSE" && originalTx.sourceAccountId) {
      await tx.account.update({
        where: { id: originalTx.sourceAccountId },
        data: { balance: { increment: originalTx.amount } },
      });
    } else if (
      originalTx.type === "TRANSFER" &&
      originalTx.sourceAccountId &&
      originalTx.destinationAccountId
    ) {
      await tx.account.update({
        where: { id: originalTx.sourceAccountId },
        data: { balance: { increment: originalTx.amount } },
      });
      await tx.account.update({
        where: { id: originalTx.destinationAccountId },
        data: { balance: { decrement: originalTx.amount } },
      });
    }

    // 2.5. Check balance for EXPENSE and TRANSFER
    if (
      (parsed.type === "EXPENSE" || parsed.type === "TRANSFER") &&
      parsed.sourceAccountId
    ) {
      const sourceAccAfterReversal = await tx.account.findUnique({
        where: { id: parsed.sourceAccountId },
      });
      if (
        sourceAccAfterReversal &&
        Number(sourceAccAfterReversal.balance) < parsed.amount
      ) {
        throw new TransactionError(
          "INSUFFICIENT_BALANCE",
          "Insufficient balance",
        );
      }
    }

    // 1.7. Resolve Merchant from Name
    let finalMerchantId = parsed.merchantId;
    if (parsed.merchantName !== undefined) {
      if (parsed.merchantName.trim() !== "") {
        const merchantSearchName = parsed.merchantName.trim();
        const existingMerchant = await tx.merchant.findFirst({
          where: {
            userId,
            name: {
              equals: merchantSearchName,
              mode: "insensitive",
            },
          },
        });

        if (existingMerchant) {
          finalMerchantId = existingMerchant.id;
        } else {
          const newMerchant = await tx.merchant.create({
            data: {
              userId,
              name: merchantSearchName,
            },
          });
          finalMerchantId = newMerchant.id;
        }
      } else {
        finalMerchantId = null; // clear merchant if empty string
      }
    } else {
      // if not provided in payload at all, keep original
      finalMerchantId =
        parsed.merchantId !== undefined
          ? parsed.merchantId
          : originalTx.merchantId;
    }

    // 3. Apply new financial effects
    if (
      (parsed.type === "INCOME" || parsed.type === "INITIAL_BALANCE") &&
      parsed.destinationAccountId
    ) {
      await tx.account.update({
        where: { id: parsed.destinationAccountId },
        data: { balance: { increment: parsed.amount } },
      });
    } else if (parsed.type === "EXPENSE" && parsed.sourceAccountId) {
      await tx.account.update({
        where: { id: parsed.sourceAccountId },
        data: { balance: { decrement: parsed.amount } },
      });
    } else if (
      parsed.type === "TRANSFER" &&
      parsed.sourceAccountId &&
      parsed.destinationAccountId
    ) {
      await tx.account.update({
        where: { id: parsed.sourceAccountId },
        data: { balance: { decrement: parsed.amount } },
      });
      await tx.account.update({
        where: { id: parsed.destinationAccountId },
        data: { balance: { increment: parsed.amount } },
      });
    }

    // 4. Update transaction record
    return await tx.transaction.update({
      where: { id },
      data: {
        type: parsed.type,
        amount: parsed.amount,
        date: parsed.date,
        description: parsed.description,
        notes: parsed.notes,
        categoryId:
          parsed.categoryId !== undefined
            ? parsed.categoryId
            : originalTx.categoryId,
        merchantId: finalMerchantId,
        sourceAccountId: parsed.sourceAccountId,
        destinationAccountId: parsed.destinationAccountId,
      },
    });
  });
}

export async function deleteTransaction(userId: string, id: string) {
  return await db.$transaction(async (tx: any) => {
    const originalTx = await tx.transaction.findUnique({ where: { id } });
    if (!originalTx || originalTx.userId !== userId)
      throw new TransactionError("UNAUTHORIZED", "Unauthorized transaction");

    // Reverse original financial effects
    if (
      (originalTx.type === "INCOME" || originalTx.type === "INITIAL_BALANCE") &&
      originalTx.destinationAccountId
    ) {
      await tx.account.update({
        where: { id: originalTx.destinationAccountId },
        data: { balance: { decrement: originalTx.amount } },
      });
    } else if (originalTx.type === "EXPENSE" && originalTx.sourceAccountId) {
      await tx.account.update({
        where: { id: originalTx.sourceAccountId },
        data: { balance: { increment: originalTx.amount } },
      });
    } else if (
      originalTx.type === "TRANSFER" &&
      originalTx.sourceAccountId &&
      originalTx.destinationAccountId
    ) {
      await tx.account.update({
        where: { id: originalTx.sourceAccountId },
        data: { balance: { increment: originalTx.amount } },
      });
      await tx.account.update({
        where: { id: originalTx.destinationAccountId },
        data: { balance: { decrement: originalTx.amount } },
      });
    }

    // Delete transaction
    return await tx.transaction.delete({ where: { id } });
  });
}

export async function getTransactions(
  userId: string,
  limit = 50,
  offset = 0,
  type?: string,
) {
  return await db.transaction.findMany({
    where: {
      userId,
      ...(type ? { type: type as any } : {}),
    },
    include: {
      category: true,
      sourceAccount: true,
      destinationAccount: true,
      merchant: true,
    },
    orderBy: { date: "desc" },
    take: limit,
    skip: offset,
  });
}

export async function getTransactionById(userId: string, id: string) {
  const tx = await db.transaction.findUnique({
    where: { id },
    include: {
      category: true,
      sourceAccount: true,
      destinationAccount: true,
      merchant: true,
    },
  });

  if (!tx || tx.userId !== userId) {
    throw new TransactionError(
      "UNAUTHORIZED",
      "Transaction not found or unauthorized",
    );
  }

  return tx;
}
