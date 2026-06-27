import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Input from "@/components/Input";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/context/authContext";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

const register = () => {
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const nameRef = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { register: registerUser } = useAuth();

  const handleSubmit = async () => {
    if (!emailRef.current || !passwordRef.current || !nameRef.current) {
      return Alert.alert("Sign up", "Please fill all the fields");
    }
    setIsLoading(true);
    const res = await registerUser(
      nameRef.current,
      emailRef.current,
      passwordRef.current,
    );

    setIsLoading(false);

    if (res.success) {
      return Alert.alert("Sign up", res?.msg);
    } else {
      return Alert.alert("Sign up", res?.msg);
    }
  };
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <BackButton iconSize={28} />
        <View style={{ gap: 5, marginTop: spacingY._20 }}>
          <Typo size={30} fontWeight={"800"}>
            Let's
          </Typo>
          <Typo size={30} fontWeight={"800"}>
            Get Started
          </Typo>
        </View>
        <View style={styles.form}>
          <Typo size={16} color={colors.textLight}>
            Create an account to track your expenses
          </Typo>
          <Input
            placeholder="Enter your name"
            onChangeText={(value) => (nameRef.current = value)}
            icon={
              <Icons.UserIcon
                size={verticalScale(26)}
                color={colors.neutral300}
                weight="fill"
              />
            }
          />
          <Input
            placeholder="Enter your email"
            onChangeText={(value) => (emailRef.current = value)}
            icon={
              <Icons.AtIcon
                size={verticalScale(26)}
                color={colors.neutral300}
                weight="fill"
              />
            }
          />
          <Input
            placeholder="Enter your password"
            onChangeText={(value) => (passwordRef.current = value)}
            icon={
              <Icons.LockIcon
                size={verticalScale(26)}
                color={colors.neutral300}
                weight="fill"
              />
            }
          />

          <Button loading={isLoading} onPress={handleSubmit}>
            <Typo fontWeight={"700"} color={colors.black}>
              Register
            </Typo>
          </Button>
        </View>
        <View style={styles.footer}>
          <Typo size={15}>Already have any account?</Typo>
          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Typo size={15} fontWeight={"700"} color={colors.primary}>
              Login
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._30,
    paddingHorizontal: spacingX._20,
  },
  welcomeText: {
    fontSize: verticalScale(20),
    fontWeight: "bold",
    color: colors.text,
  },
  form: {
    gap: spacingY._20,
  },
  forgetPassword: {
    textAlign: "right",
    fontWeight: "500",
    color: colors.text,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacingX._5,
    alignItems: "center",
    color: colors.text,
    fontSize: verticalScale(15),
  },
});
