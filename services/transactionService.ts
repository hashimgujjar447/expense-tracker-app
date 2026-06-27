import { fireStore } from "@/config/firebase";
import { colors } from "@/constants/theme";
import { ResponseType, TransactionType, WalletType } from "@/types";
import { getLast7Days, getLast12Months, getYearsRange } from "@/utils/common";
import { scale } from "@/utils/styling";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";
import { createOrUpdateWallet } from "./walletService";

export const createOrUpdateTransaction = async (
  transactionData: Partial<TransactionType>,
): Promise<ResponseType> => {
  try {
    const { id, type, walletId, amount } = transactionData;

    if (!amount || amount <= 0 || !walletId || !type) {
      return {
        success: false,
        msg: "Invalid transaction data!",
      };
    }

    if (id) {
      const oldTransactionSnapshot = await getDoc(
        doc(fireStore, "transactions", id),
      );

      if (!oldTransactionSnapshot.exists()) {
        return {
          success: false,
          msg: "Transaction not found",
        };
      }

      const transaction = oldTransactionSnapshot.data() as TransactionType;

      if (
        transaction.type !== type ||
        transaction.amount !== amount ||
        transaction.walletId !== walletId
      ) {
        const res = await revertOrUpdateWallet(
          transaction,
          type,
          walletId,
          amount,
        );

        if (!res.success) return res;
      }
    } else {
      const res = await updateWalletForNewTransaction(walletId, amount, type);

      if (!res.success) return res;
    }

    if (transactionData.image && transactionData.image.uri) {
      const imageUploadResponse = await uploadFileToCloudinary(
        transactionData.image,
        "transactions",
      );

      if (!imageUploadResponse.success) {
        return {
          success: false,
          msg: imageUploadResponse.msg || "Failed to upload image",
        };
      }

      transactionData.image = imageUploadResponse.data;
    }

    const transactionRef = id
      ? doc(fireStore, "transactions", id)
      : doc(collection(fireStore, "transactions"));

    await setDoc(transactionRef, transactionData, { merge: true });

    return {
      success: true,
      data: {
        ...transactionData,
        id: transactionRef.id,
      },
    };
  } catch (err: any) {
    console.log("Transaction Error:", err);

    return {
      success: false,
      msg: err.message,
    };
  }
};

const updateWalletForNewTransaction = async (
  walletId: string,
  amount: number,
  type: string,
): Promise<ResponseType> => {
  try {
    const walletRef = doc(fireStore, "wallets", walletId);

    const walletSnapshot = await getDoc(walletRef);

    if (!walletSnapshot.exists()) {
      return {
        success: false,
        msg: "Wallet not found",
      };
    }

    const wallet = walletSnapshot.data() as WalletType;

    if (type === "expense" && Number(wallet.amount) < amount) {
      return {
        success: false,
        msg: "Insufficient wallet balance",
      };
    }

    const updateType = type === "income" ? "totalIncome" : "totalExpenses";

    const updatedWalletAmount =
      type === "income"
        ? Number(wallet.amount) + amount
        : Number(wallet.amount) - amount;

    const updatedTotal = Number(wallet[updateType] ?? 0) + amount;

    await updateDoc(walletRef, {
      amount: updatedWalletAmount,
      [updateType]: updatedTotal,
    });

    return {
      success: true,
    };
  } catch (err: any) {
    console.log("Wallet update error:", err);

    return {
      success: false,
      msg: err.message,
    };
  }
};

const revertOrUpdateWallet = async (
  oldTransaction: TransactionType,
  updatedType: string,
  newWalletId: string,
  newAmount: number,
): Promise<ResponseType> => {
  try {
    if (!oldTransaction.walletId) {
      return {
        success: false,
        msg: "Missing wallet id",
      };
    }

    // Original Wallet
    const originalWalletSnapshot = await getDoc(
      doc(fireStore, "wallets", oldTransaction.walletId),
    );

    if (!originalWalletSnapshot.exists()) {
      return {
        success: false,
        msg: "Original wallet not found",
      };
    }

    let originalWallet = originalWalletSnapshot.data() as WalletType;

    // New Wallet
    let newWalletSnapshot = await getDoc(
      doc(fireStore, "wallets", newWalletId),
    );

    if (!newWalletSnapshot.exists()) {
      return {
        success: false,
        msg: "New wallet not found",
      };
    }

    let newWallet = newWalletSnapshot.data() as WalletType;

    const revertType =
      oldTransaction.type === "income" ? "totalIncome" : "totalExpenses";

    const revertedWalletAmount =
      oldTransaction.type === "income"
        ? Number(originalWallet.amount) - Number(oldTransaction.amount)
        : Number(originalWallet.amount) + Number(oldTransaction.amount);

    const revertedTotal =
      Number(originalWallet[revertType] ?? 0) - Number(oldTransaction.amount);

    // Balance check
    if (updatedType === "expense") {
      if (
        oldTransaction.walletId === newWalletId &&
        revertedWalletAmount < newAmount
      ) {
        return {
          success: false,
          msg: "Insufficient balance",
        };
      }

      if (
        oldTransaction.walletId !== newWalletId &&
        Number(newWallet.amount) < newAmount
      ) {
        return {
          success: false,
          msg: "Selected wallet has insufficient balance",
        };
      }
    }

    // Revert old wallet
    const revertRes = await createOrUpdateWallet({
      id: oldTransaction.walletId,
      amount: revertedWalletAmount,
      [revertType]: revertedTotal,
    });

    if (!revertRes.success) return revertRes;

    // Refresh new wallet
    newWalletSnapshot = await getDoc(doc(fireStore, "wallets", newWalletId));

    newWallet = newWalletSnapshot.data() as WalletType;

    const updateType =
      updatedType === "income" ? "totalIncome" : "totalExpenses";

    const updatedWalletAmount =
      updatedType === "income"
        ? Number(newWallet.amount) + newAmount
        : Number(newWallet.amount) - newAmount;

    const updatedTotal = Number(newWallet[updateType] ?? 0) + newAmount;

    const updateRes = await createOrUpdateWallet({
      id: newWalletId,
      amount: updatedWalletAmount,
      [updateType]: updatedTotal,
    });

    if (!updateRes.success) return updateRes;

    return {
      success: true,
    };
  } catch (err: any) {
    console.log("Wallet update error:", err);

    return {
      success: false,
      msg: err.message,
    };
  }
};

export const deleteTransaction = async (transaction: TransactionType) => {
  try {
    if (!transaction.id) {
      throw new Error("Transaction id is missing");
    }

    if (!transaction.walletId) {
      throw new Error("Wallet id is missing");
    }

    const getTransaction = await doc(fireStore, "transactions", transaction.id);
    const getWalletSnapShot = await getDoc(
      doc(fireStore, "wallets", transaction.walletId),
    );

    if (!getWalletSnapShot.exists()) {
      throw new Error("Wallet not found");
    }

    const updateType =
      transaction.type === "income" ? "totalIncome" : "totalExpenses";

    const walletData = getWalletSnapShot.data() as WalletType;

    const currentTypeAmount = walletData[updateType];
    if (currentTypeAmount === undefined) {
      throw new Error(`Missing wallet field: ${updateType}`);
    }

    const newWalletAmount =
      transaction.type === "income"
        ? Number(walletData.amount) - Number(transaction.amount)
        : Number(walletData.amount) + Number(transaction.amount);
    const newWalletTypeAmount = currentTypeAmount - Number(transaction.amount);
    const walletRes = await createOrUpdateWallet({
      id: transaction.walletId,
      amount: newWalletAmount,
      [updateType]: newWalletTypeAmount,
    });

    console.log(walletRes);

    if (!walletRes.success) {
      return walletRes;
    }

    console.log("Deleting transaction...");
    await deleteDoc(getTransaction);
    console.log("Deleted");

    return {
      success: true,
      msg: "Transaction deleted successfully",
    };
  } catch (err: any) {
    console.log("Wallet update error:", err);

    return {
      success: false,
      msg: err.message,
    };
  }
};

export const fetchWeeklyStats = async (uid: string) => {
  try {
    const db = fireStore;
    const date = new Date();
    const sevenDaysAgo = new Date(date);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("date", ">=", Timestamp.fromDate(sevenDaysAgo)),
      where("date", "<=", Timestamp.fromDate(date)),
      orderBy("date", "desc"),
      where("uid", "==", uid),
    );

    const querySnapshot = await getDocs(transactionsQuery);

    const weeklyData = getLast7Days();
    const transactions: TransactionType[] = [];

    // mapping each transaction in day
    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id;
      transactions.push(transaction);

      const transactionDate = (transaction.date as Timestamp)
        .toDate()
        .toISOString()
        .split("T")[0]; // as specific date

      const dayData = weeklyData.find((day) => day.date == transactionDate);

      if (dayData) {
        if (transaction.type == "income") {
          dayData.income += transaction.amount;
        } else if (transaction.type == "expense") {
          dayData.expense += transaction.amount;
        }
      }
    });

    const stats = weeklyData.flatMap((day) => [
      {
        value: day.income,
        label: day.day,
        spacing: scale(4),
        labelWidth: scale(30),
        frontColor: colors.primary,
      },
      {
        value: day.expense,
        frontColor: colors.rose,
      },
    ]);

    return {
      success: true,
      data: {
        stats,
        transactions,
      },
    };
  } catch (err: any) {
    console.log("Wallet update error:", err);

    return {
      success: false,
      msg: err.message,
    };
  }
};

export const fetchMonthlyStats = async (uid: string) => {
  try {
    const db = fireStore;
    const date = new Date();
    const twelveMonthsAgo = new Date(date);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("date", ">=", Timestamp.fromDate(twelveMonthsAgo)),
      where("date", "<=", Timestamp.fromDate(date)),
      orderBy("date", "desc"),
      where("uid", "==", uid),
    );

    const querySnapshot = await getDocs(transactionsQuery);

    const monthlyData = getLast12Months();
    const transactions: TransactionType[] = [];
    const monthsOfYear = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id;
      transactions.push(transaction);

      const tDate = (transaction.date as Timestamp).toDate();
      const tMonthName = monthsOfYear[tDate.getMonth()];
      const tShortYear = tDate.getFullYear().toString().slice(-2);
      const tFormattedMonthYear = `${tMonthName} ${tShortYear}`;

      const monthData = monthlyData.find((m) => m.month === tFormattedMonthYear);

      if (monthData) {
        if (transaction.type === "income") {
          monthData.income += transaction.amount;
        } else if (transaction.type === "expense") {
          monthData.expense += transaction.amount;
        }
      }
    });

    const stats = monthlyData.flatMap((month) => [
      {
        value: month.income,
        label: month.month,
        spacing: scale(4),
        labelWidth: scale(40),
        frontColor: colors.primary,
      },
      {
        value: month.expense,
        frontColor: colors.rose,
      },
    ]);

    return {
      success: true,
      data: {
        stats,
        transactions,
      },
    };
  } catch (err: any) {
    console.log("Monthly stats error:", err);

    return {
      success: false,
      msg: err.message,
    };
  }
};

export const fetchYearlyStats = async (uid: string) => {
  try {
    const db = fireStore;
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 4; // last 5 years

    const startDate = new Date(startYear, 0, 1);
    const date = new Date();

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<=", Timestamp.fromDate(date)),
      orderBy("date", "desc"),
      where("uid", "==", uid),
    );

    const querySnapshot = await getDocs(transactionsQuery);

    const yearlyData = getYearsRange(startYear, currentYear);
    const transactions: TransactionType[] = [];

    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id;
      transactions.push(transaction);

      const tDate = (transaction.date as Timestamp).toDate();
      const tYear = tDate.getFullYear().toString();

      const yearData = yearlyData.find((y: any) => y.year === tYear);

      if (yearData) {
        if (transaction.type === "income") {
          yearData.income += transaction.amount;
        } else if (transaction.type === "expense") {
          yearData.expense += transaction.amount;
        }
      }
    });

    const stats = yearlyData.flatMap((year: any) => [
      {
        value: year.income,
        label: year.year,
        spacing: scale(4),
        labelWidth: scale(35),
        frontColor: colors.primary,
      },
      {
        value: year.expense,
        frontColor: colors.rose,
      },
    ]);

    return {
      success: true,
      data: {
        stats,
        transactions,
      },
    };
  } catch (err: any) {
    console.log("Yearly stats error:", err);

    return {
      success: false,
      msg: err.message,
    };
  }
};
