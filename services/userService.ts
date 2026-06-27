import { fireStore } from "@/config/firebase";
import { ResponseType, UserDataType } from "@/types";
import { doc, updateDoc } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";

export const updateUser = async (
  uid: string,
  updatedData: UserDataType,
): Promise<ResponseType> => {
  try {
    // image upload pending

    if (updatedData.image && updatedData.image.uri) {
      const imageUploadResponse = await uploadFileToCloudinary(
        updatedData.image,
        "users",
      );
      if (!imageUploadResponse.success) {
        return {
          success: false,
          msg: imageUploadResponse.msg || "Failed to upload image",
        };
      }
      updatedData.image = imageUploadResponse?.data;
    }

    const userRef = doc(fireStore, "users", uid);

    await updateDoc(userRef, updatedData);

    return { success: true, msg: "updated successfully" };
  } catch (error: any) {
    console.log("error updating user: ", error);
    return { success: false, msg: error?.message };
  }
};
