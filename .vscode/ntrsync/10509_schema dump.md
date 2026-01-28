# schema dump

model Script {
  id       String  @id @default(cuid())
  name     String?
  email    String?
  content  String?
  category String?
  subCat   String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model SalespersonSched {
  id               String    @id @default(cuid())
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  day              String?
  start            DateTime?
  end              DateTime?
  salespersonEmail String?
  userEmail        String?
  title            String?
  resourceId       String?
  userName         String?
  userId           String?
  name             String?
}

model DealerTasks {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  dealerId  String? // DEV-1
  title     String?
  status    String?
  priority  String?
  userName  String?
  userEmail String?
  dept      String?
  label     String?

  DealerTasksUpdates DealerTasksUpdates[]
}

model DealerTasksUpdates {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  update        String?
  userName      String?
  userEmail     String?
  dealerTasksId String?
  status        String?
  priority      String?
  label         String?

  DealerTasks DealerTasks? @relation(fields: [dealerTasksId], references: [id])

  @@unique([dealerTasksId])
}
model Automation {
  id           String  @id @default(cuid())
  userEmail    String?
  type         String?
  financeId    String?
  clientfileId String?
}

model WorkOrderNotes {
  id          String     @id @default(cuid())
    createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  body        String?
  userName    String?
  userEmail   String?

}
