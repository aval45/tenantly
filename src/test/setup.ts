import "react-native-gesture-handler/jestSetup";

jest.mock("react-native-reanimated", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("react-native-reanimated/mock"),
);

jest.mock("lucide-react-native", () => ({
  AlertCircle: () => null,
  Building2: () => null,
}));

jest.mock("heroui-native/button", () => {
  function Button() {
    return null;
  }
  Button.Label = function ButtonLabel() {
    return null;
  };
  return {
    Button,
  };
});
