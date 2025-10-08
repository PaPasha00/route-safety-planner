import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60, // Add top padding for transparent header
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    color: "#1a1a1a",
    textAlign: "center",
  },
  note: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4a4a4a",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4a4a4a",
  },
  ratingBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingValue: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statItem: {
    alignItems: "center",
    width: "48%",
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  chip: {
    backgroundColor: "#e9ecef",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
    color: "#495057",
    fontWeight: "500",
  },
  weatherContainer: {
    marginTop: 8,
  },
  weatherMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  weatherTemp: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  weatherConditions: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  weatherDetails: {
    gap: 4,
  },
  weatherDetail: {
    fontSize: 14,
    color: "#4a4a4a",
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4a4a4a",
  },
  dayContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  dayStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  dayStat: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  dayDescription: {
    fontSize: 14,
    color: "#4a4a4a",
    lineHeight: 20,
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#ff6b6b",
    backgroundColor: "#fff5f5",
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#d63031",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#e17055",
  },
});
