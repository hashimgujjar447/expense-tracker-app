import { expenseCategories, incomeCategory } from "@/constants/data";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import {
  TransactionItemProps,
  TransactionListType,
  TransactionType,
} from "@/types";
import { verticalScale } from "@/utils/styling";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Loading from "./Loading";
import Typo from "./Typo";

const TransactionList = ({
  data,
  title,
  loading,
  emptyListMessage,
}: TransactionListType) => {
  const router = useRouter();
  const handleClick = (item: TransactionType) => {
    router.push({
      pathname: "/(modals)/transactionModal",
      params: {
        id: item.id,
        type: item.type,
        amount: item.amount.toString(),
        category: item?.category,
        date: (item.date as Timestamp)?.toDate()?.toISOString(),
        description: item.description,
        image: item.image,
        uid: item.uid,
        walletId: item.walletId,
      },
    });
  };
  return (
    <View style={styles.container}>
      {title && (
        <Typo size={20} fontWeight={"500"} style={{ marginTop: spacingY._15 }}>
          {title}
        </Typo>
      )}

      <View style={styles.list}>
        <FlashList
          data={data}
          renderItem={({ item, index }) => (
            <TransactionItem
              item={item}
              index={index}
              handleClick={handleClick}
            />
          )}
        />
      </View>

      {!loading && data.length == 0 && (
        <Typo
          size={15}
          color={colors.neutral400}
          style={{ textAlign: "center", marginTop: spacingY._15 }}
        >
          {emptyListMessage}
        </Typo>
      )}

      {loading && (
        <View style={{ top: verticalScale(100) }}>
          <Loading />
        </View>
      )}
    </View>
  );
};

const TransactionItem = ({
  item,
  index,
  handleClick,
}: TransactionItemProps) => {
  const category =
    item.type === "income"
      ? incomeCategory
      : (expenseCategories[item.category as keyof typeof expenseCategories] ??
        expenseCategories.others);

  const IconComponent = category.icon;

  const getFormattedDate = () => {
    if (!item.date) return "";
    let dateObj: Date;
    if (item.date instanceof Timestamp) {
      dateObj = item.date.toDate();
    } else if (typeof (item.date as any).toDate === "function") {
      dateObj = (item.date as any).toDate();
    } else if (typeof item.date === "string") {
      dateObj = new Date(item.date);
    } else if (item.date instanceof Date) {
      dateObj = item.date;
    } else if (typeof item.date === "object" && "seconds" in (item.date as any)) {
      dateObj = new Date((item.date as any).seconds * 1000);
    } else {
      dateObj = new Date();
    }
    const months = [
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
    return `${dateObj.getDate()} ${months[dateObj.getMonth()]}`;
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)
        .springify()
        .damping(14)}
    >
      <TouchableOpacity style={styles.row} onPress={() => handleClick(item)}>
        <View style={[styles.icon, { backgroundColor: category.bgColor }]}>
          {IconComponent && (
            <IconComponent
              size={verticalScale(25)}
              weight="fill"
              color={colors.white}
            />
          )}
        </View>

        <View style={styles.categoryDes}>
          <Typo size={17}>
            {item.type === "income" ? "Income" : item.category}
          </Typo>
          <Typo
            size={12}
            color={colors.neutral400}
            textProps={{ numberOfLines: 1 }}
          >
            {item.description}
          </Typo>
        </View>
        <View style={styles.amountDate}>
          {item.type === "income" ? (
            <Typo fontWeight={"500"} color={colors.primary}>
              + ${item.amount}
            </Typo>
          ) : (
            <Typo fontWeight={"500"} color={colors.rose}>
              - ${item.amount}
            </Typo>
          )}
          <Typo size={13} color={colors.neutral400}>
            {getFormattedDate()}
          </Typo>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default TransactionList;

const styles = StyleSheet.create({
  container: {
    gap: spacingY._17,
    // flex: 1,
    // backgroundColor: "red",
  },

  list: {
    minHeight: 3,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacingX._12,
    marginBottom: spacingY._12,

    // List with background
    backgroundColor: colors.neutral800,
    padding: spacingY._10,
    paddingHorizontal: spacingY._10,
    borderRadius: radius._17,
  },

  icon: {
    height: verticalScale(44),
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius._12,
    borderCurve: "continuous",
  },

  categoryDes: {
    flex: 1,
    gap: 2.5,
  },

  amountDate: {
    alignItems: "flex-end",
    gap: 3,
  },
});
