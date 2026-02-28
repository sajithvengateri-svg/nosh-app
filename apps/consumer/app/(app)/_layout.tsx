import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="feed" />
      <Stack.Screen
        name="recipe/[recipeId]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="recipe/ingredients/[recipeId]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="shopping/[recipeId]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="nosh-plus/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="savings/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="leftovers/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="cook-mode/[recipeId]"
        options={{ gestureEnabled: false, animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}
