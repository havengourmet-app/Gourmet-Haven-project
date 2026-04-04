export async function listAssignedDeliveries(req, res) {
  res.json({
    success: true,
    data: [
      {
        id: "9df4583f-931a-4a8a-a8b9-e5fd83c3ce8a",
        status: "assigned",
        city: "Hyderabad"
      }
    ]
  });
}
