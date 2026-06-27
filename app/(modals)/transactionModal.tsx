import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import ImageUpload from "@/components/ImageUpload";
import Input from "@/components/Input";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { expenseCategories, transactionTypes } from "@/constants/data";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/context/authContext";
import useFetchData from "@/hooks/useFetchData";
import {
  createOrUpdateTransaction,
  deleteTransaction,
} from "@/services/transactionService";
import { TransactionType, WalletType } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { orderBy, where } from "firebase/firestore";
import * as Icons from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
type TransactionParams = {
  id?: string;
  type?: TransactionType["type"];
  amount?: string;
  date?: string;
  walletId?: string;
  category?: string;
  image?: string;
  description?: string;
};

const TransactionModal = () => {
  const [transaction, setTransaction] = useState<TransactionType>({
    type: "expense",
    amount: 0,
    description: "",
    category: "",
    date: new Date(),
    walletId: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { user, updateUserData } = useAuth();
  const router = useRouter();

  const {
    data: wallets,
    loading: walletLoading,
    error,
  } = useFetchData<WalletType>("wallets", [
    where("uid", "==", user?.uid),
    orderBy("created", "desc"),
  ]);

  const oldTransaction = useLocalSearchParams<TransactionParams>();

  useEffect(() => {
    if (!oldTransaction?.id) return;
    console.log(oldTransaction);
    setTransaction({
      id: oldTransaction.id,
      type: oldTransaction.type || "expense",
      amount: Number(oldTransaction.amount) || 0,
      walletId: oldTransaction.walletId || "",
      category: oldTransaction.category || "",
      description: oldTransaction.description || "",
      image: oldTransaction.image || null,
      date: oldTransaction.date ? new Date(oldTransaction.date) : new Date(),
    });
  }, []);

  const onSubmit = async () => {
    const { type, amount, date, category, walletId, image, description } =
      transaction;

    // Wallet Required
    if (!walletId) {
      return Alert.alert("Required", "Please select a wallet.");
    }

    // Amount Required
    if (amount <= 0) {
      return Alert.alert("Required", "Please enter a valid amount.");
    }

    // Expense Category Required
    if (type === "expense" && !category) {
      return Alert.alert("Required", "Please select an expense category.");
    }

    const transactionData: Partial<TransactionType> = {
      type,
      amount,
      date,
      category: type === "expense" ? category : "",
      walletId,
      image, // optional
      description,
      uid: user?.uid,
    };

    if (oldTransaction?.id) transactionData.id = oldTransaction.id;
    console.log(transactionData);
    setLoading(true);

    const res = await createOrUpdateTransaction(transactionData);

    setLoading(false);

    if (res.success) {
      router.back();
    } else {
      Alert.alert("Transaction", res.msg);
    }
  };

  const onDelete = async () => {
    if (!transaction.id) return;

    setLoading(true);

    const res = await deleteTransaction(transaction);

    setLoading(false);

    if (res?.success) {
      router.back();
    } else {
      Alert.alert("Error", res?.msg || "Failed to delete transaction");
    }
  };
  const showDeleteAlert = () => {
    Alert.alert(
      "Confirm",
      "Are you sure you want to do this?\nThis action will remove the transaction",
      [
        {
          text: "Cancel",
          onPress: () => console.log("cancel delete"),
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => onDelete(),
          style: "destructive",
        },
      ],
    );
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (event.type === "dismissed") return;

    if (selectedDate) {
      setTransaction((prev) => ({
        ...prev,
        date: selectedDate,
      }));
    }
  };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={oldTransaction?.id ? "Update Transaction" : "New Transaction"}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        {/* form */}
        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Type</Typo>
            <Dropdown
              style={[styles.dropdownContainer]}
              activeColor={colors.neutral700}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              iconStyle={styles.dropdownIcon}
              data={transactionTypes}
              maxHeight={300}
              labelField="label"
              valueField="value"
              itemTextStyle={styles.dropdownItemText}
              itemContainerStyle={styles.dropdownItemContainer}
              containerStyle={styles.dropdownListContainer}
              // placeholder={!isFocus ? "Select item" : "..."}
              value={transaction.type}
              // onFocus={() => setIsFocus(true)}
              // onBlur={() => setIsFocus(false)}
              onChange={(item) => {
                setTransaction({ ...transaction, type: item.value });
              }}
            />
          </View>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Wallet</Typo>
            <Dropdown
              style={[styles.dropdownContainer]}
              activeColor={colors.neutral700}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              iconStyle={styles.dropdownIcon}
              data={wallets.map((wallet) => ({
                label: `${wallet.name} $(${wallet.amount})`,
                value: wallet.id,
              }))}
              maxHeight={300}
              labelField="label"
              valueField="value"
              itemTextStyle={styles.dropdownItemText}
              itemContainerStyle={styles.dropdownItemContainer}
              containerStyle={styles.dropdownListContainer}
              // placeholder={!isFocus ? "Select item" : "..."}
              value={transaction.walletId}
              // onFocus={() => setIsFocus(true)}
              // onBlur={() => setIsFocus(false)}
              onChange={(item) => {
                setTransaction({ ...transaction, walletId: item.value });
              }}
            />
          </View>

          {/* Expense Category */}
          {transaction.type === "expense" && (
            <View style={styles.inputContainer}>
              <Typo color={colors.neutral200}>Expense Category</Typo>
              <Dropdown
                style={[styles.dropdownContainer]}
                activeColor={colors.neutral700}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelectedText}
                iconStyle={styles.dropdownIcon}
                data={Object.values(expenseCategories)}
                maxHeight={300}
                labelField="label"
                valueField="value"
                itemTextStyle={styles.dropdownItemText}
                itemContainerStyle={styles.dropdownItemContainer}
                containerStyle={styles.dropdownListContainer}
                // placeholder={!isFocus ? "Select item" : "..."}
                value={transaction.category}
                // onFocus={() => setIsFocus(true)}
                // onBlur={() => setIsFocus(false)}
                onChange={(item) => {
                  setTransaction({
                    ...transaction,
                    category: item.value || "",
                  });
                }}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Amount</Typo>

            <Input
              placeholder="Enter amount"
              keyboardType="numeric"
              value={transaction.amount ? String(transaction.amount) : ""}
              onChangeText={(value) =>
                setTransaction({
                  ...transaction,
                  amount: Number(value) || 0,
                })
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.flexRow}>
              <Typo color={colors.neutral200} size={16}>
                Description
              </Typo>

              <Typo color={colors.neutral500} size={14}>
                (optional)
              </Typo>
            </View>

            <Input
              // placeholder="Salary"
              value={transaction.description}
              multiline
              containerStyle={{
                flexDirection: "row",
                height: verticalScale(100),
                alignItems: "flex-start",
                paddingVertical: 15,
              }}
              onChangeText={(value) =>
                setTransaction({
                  ...transaction,
                  description: value,
                })
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Date</Typo>
            {!showDatePicker && (
              <Pressable
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Typo size={14}>
                  {(transaction.date as Date).toLocaleString()}
                </Typo>
              </Pressable>
            )}

            {showDatePicker && (
              <View style={Platform.OS == "ios" && styles.iosDatePicker}>
                <DateTimePicker
                  value={transaction.date as Date}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={onDateChange}
                />
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Wallet Icon</Typo>
            <ImageUpload
              file={transaction.image}
              onClear={() => setTransaction({ ...transaction, image: null })}
              onSelect={(file) =>
                setTransaction({ ...transaction, image: file })
              }
              placeholder="Upload Image"
            />
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {oldTransaction?.id && !loading && (
          <Button
            onPress={showDeleteAlert}
            style={{
              backgroundColor: colors.rose,
              paddingHorizontal: spacingX._15,
            }}
          >
            <Icons.Trash
              color={colors.white}
              size={verticalScale(20)}
              weight="bold"
            />
          </Button>
        )}
        <Button onPress={onSubmit} loading={loading} style={{ flex: 1 }}>
          <Typo color={colors.black} fontWeight={"700"} size={18}>
            {oldTransaction?.id ? "Update Transaction" : "Add Transaction"}
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
};

export default TransactionModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingY._20,
  },

  form: {
    gap: spacingY._20,
    paddingVertical: spacingY._15,
    paddingBottom: spacingY._40,
  },

  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1,
  },

  inputContainer: {
    gap: spacingY._10,
  },

  iosDropDown: {
    flexDirection: "row",
    height: verticalScale(54),
    alignItems: "center",
    justifyContent: "center",
    fontSize: verticalScale(14),
    borderWidth: 1,
    color: colors.white,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: "continuous",
    paddingHorizontal: spacingX._15,
  },

  androidDropDown: {
    // flexDirection: "row",
    height: verticalScale(54),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    fontSize: verticalScale(14),
    color: colors.white,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: "continuous",
    // paddingHorizontal: spacingX._15,
  },

  flexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._5,
  },

  dateInput: {
    flexDirection: "row",
    height: verticalScale(54),
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: "continuous",
    paddingHorizontal: spacingX._15,
  },

  iosDatePicker: {
    // backgroundColor: "red",
  },

  datePickerButton: {
    backgroundColor: colors.neutral700,
    alignSelf: "flex-end",
    padding: spacingY._7,
    marginRight: spacingX._7,
    paddingHorizontal: spacingY._15,
    borderRadius: radius._10,
  },

  dropdownContainer: {
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: colors.neutral300,
    paddingHorizontal: spacingX._15,
    borderRadius: radius._15,
    borderCurve: "continuous",
  },

  dropdownItemText: {
    color: colors.white,
  },

  dropdownSelectedText: {
    color: colors.white,
    fontSize: verticalScale(14),
  },

  dropdownListContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    borderCurve: "continuous",
    paddingVertical: spacingY._7,
    top: 5,
    borderColor: colors.neutral500,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },

  dropdownPlaceholder: {
    color: colors.white,
  },

  dropdownItemContainer: {
    borderRadius: radius._15,
    marginHorizontal: spacingX._7,
  },

  dropdownIcon: {
    height: verticalScale(30),
    tintColor: colors.neutral300,
  },
});
