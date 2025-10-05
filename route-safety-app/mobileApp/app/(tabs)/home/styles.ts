import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  map: {
    flex: 1,
  },
  error: {
    textAlign: "center",
    marginTop: 40,
    color: "#d00",
  },
  searchToggleButton: {
    position: "absolute",
    top: 66,
    right: 30,
    zIndex: 1001,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 10,
    elevation: 6,
  },
  routeControlsContainer: {
    position: "absolute",
    top: 116,
    right: 30,
    zIndex: 1001,
    flexDirection: "column",
    gap: 8,
  },
  routeModeButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  routeModeButtonActive: {
    backgroundColor: "#007AFF",
  },
  roadRoutingButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  roadRoutingButtonActive: {
    backgroundColor: "#34C759",
  },
  routingIndicatorContainer: {
    position: "absolute",
    top: 120,
    right: 30,
    zIndex: 1002,
  },
  infoButton: {
    position: "absolute",
    right: 30,
    bottom: 100,
    zIndex: 2000,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  analyzePrimaryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 190,
    flexDirection: "row",
    columnGap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  analyzePrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  analyzePrimaryButtonDisabled: {
    opacity: 0.7,
  },
});
