import BackButton from "@/components/BackButton";
import Header from "@/components/Header";
import Input from "@/components/Input";
import ModalWrapper from "@/components/ModalWrapper";
import TransactionList from "@/components/TransactionList";
import { fireStore } from "@/config/firebase";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/context/authContext";
import { TransactionType } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import * as Icons from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

const SearchModal = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    const db = fireStore;
    const q = query(
      collection(db, "transactions"),
      where("uid", "==", user.uid),
      orderBy("date", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const fetchedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TransactionType[];
        setTransactions(fetchedData);
        setLoading(false);
      },
      (err) => {
        console.log("Search query error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  const filteredTransactions = searchQuery.trim() === ""
    ? transactions
    : transactions.filter((item) => {
        const category = item.category?.toLowerCase() || "";
        const description = item.description?.toLowerCase() || "";
        const type = item.type?.toLowerCase() || "";
        const queryStr = searchQuery.toLowerCase().trim();

        return (
          category.includes(queryStr) ||
          description.includes(queryStr) ||
          type.includes(queryStr)
        );
      });

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title="Search"
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._15 }}
        />

        <Input
          placeholder="Search transactions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
          icon={
            <Icons.MagnifyingGlass
              size={verticalScale(20)}
              color={colors.neutral400}
              weight="bold"
            />
          }
          containerStyle={styles.searchInput}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TransactionList
            data={filteredTransactions}
            loading={loading}
            emptyListMessage="No transactions matched your search"
          />
        </ScrollView>
      </View>
    </ModalWrapper>
  );
};

export default SearchModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._10,
    gap: spacingY._15,
  },
  searchInput: {
    marginBottom: spacingY._5,
  },
  scrollContainer: {
    paddingBottom: verticalScale(50),
  },
});
