import { fireStore } from "@/config/firebase";
import { ResponseType, WalletType } from "@/types";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";

export const createOrUpdateWallet = async (
  walletData: Partial<WalletType>,
): Promise<ResponseType> => {
  try {
    let walletToSave = { ...walletData };

    if (walletData.image) {
      const imageUploadRes = await uploadFileToCloudinary(
        walletData.image,
        "wallets",
      );

      if (!imageUploadRes.success) {
        return {
          success: false,
          msg: imageUploadRes.msg || "Failed to upload wallet icon",
        };
      }

      walletToSave.image = imageUploadRes.data;
    }
    if (!walletData.id) {
      walletToSave.amount = 0;
      walletToSave.totalExpenses = 0;
      walletToSave.totalIncome = 0;
      walletToSave.created = new Date();
    }
    const walletRef = walletData?.id
      ? doc(fireStore, "wallets", walletData?.id)
      : doc(collection(fireStore, "wallets"));

    await setDoc(walletRef, walletToSave, { merge: true });
    return { success: true, data: { ...walletToSave, id: walletRef.id } };
  } catch (error: any) {
    console.log("error creating or updating wallet: ", error);
    return { success: false, msg: error.message };
  }
};

export const deleteWallet = async (walletId: string): Promise<ResponseType> => {
  try {
    const transactionRes = await deleteTransactionsByWalletId(walletId);

    if (!transactionRes.success) {
      return transactionRes;
    }

    const walletRef = doc(fireStore, "wallets", walletId);

    await deleteDoc(walletRef);

    return { success: true, msg: "Wallet deleted successfully" };
  } catch (error: any) {
    console.log("Error is ", error);
    return { success: false, msg: error.message };
  }
};

export const deleteTransactionsByWalletId = async (
  walletId: string,
): Promise<ResponseType> => {
  try {
    let hasMoreTransactions = true;

    while (hasMoreTransactions) {
      const transactionsQuery = query(
        collection(fireStore, "transactions"),
        where("walletId", "==", walletId),
      );

      const transactionsSnapshot = await getDocs(transactionsQuery);

      if (transactionsSnapshot.empty) {
        hasMoreTransactions = false;
        break;
      }

      const batch = writeBatch(fireStore);

      transactionsSnapshot.forEach((transactionDoc) => {
        batch.delete(transactionDoc.ref);
      });

      // ⭐ Don't forget this
      await batch.commit();
    }

    return {
      success: true,
      msg: "Transactions deleted successfully",
    };
  } catch (error: any) {
    console.log(error);

    return {
      success: false,
      msg: error.message,
    };
  }
};
