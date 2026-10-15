CREATE TABLE "MatriculaSequence" (
    "year" INTEGER NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MatriculaSequence_pkey" PRIMARY KEY ("year")
);
