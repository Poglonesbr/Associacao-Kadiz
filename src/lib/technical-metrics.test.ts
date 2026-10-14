import { describe, expect, it } from "vitest";
import { averageFollowUpMonths, getPiaReviewHealth, groupExitsByType } from "@/lib/technical-metrics";

const today = new Date("2026-10-14T12:00:00");

describe("technical dashboard metrics", () => {
  it("calculates current, overdue and missing PIA reassessments", () => {
    const metrics = getPiaReviewHealth(
      [
        {
          status: "ATIVO",
          ingressoDate: today,
          closeDate: null,
          nextReviewDate: new Date("2026-11-01"),
          closeType: null,
        },
        {
          status: "ATIVO",
          ingressoDate: today,
          closeDate: null,
          nextReviewDate: new Date("2026-10-01"),
          closeType: null,
        },
        { status: "ATIVO", ingressoDate: today, closeDate: null, nextReviewDate: null, closeType: null },
        { status: "ENCERRADO", ingressoDate: today, closeDate: today, nextReviewDate: null, closeType: "EVASAO" },
      ],
      today,
    );
    expect(metrics).toEqual({ active: 3, updated: 1, overdue: 1, withoutDate: 1, percent: 33 });
  });

  it("calculates the average follow-up duration using closure date or today", () => {
    expect(
      averageFollowUpMonths(
        [
          {
            status: "ATIVO",
            ingressoDate: new Date("2026-09-14T12:00:00"),
            closeDate: null,
            nextReviewDate: null,
            closeType: null,
          },
          {
            status: "ENCERRADO",
            ingressoDate: new Date("2026-08-14T12:00:00"),
            closeDate: new Date("2026-10-14T12:00:00"),
            nextReviewDate: null,
            closeType: "EVASAO",
          },
        ],
        today,
      ),
    ).toBeCloseTo(1.5, 1);
  });

  it("groups exits by their type and ignores active or unclassified records", () => {
    expect(
      groupExitsByType([
        { status: "ENCERRADO", ingressoDate: today, closeDate: today, nextReviewDate: null, closeType: "EVASAO" },
        { status: "ENCERRADO", ingressoDate: today, closeDate: today, nextReviewDate: null, closeType: "EVASAO" },
        {
          status: "ENCERRADO",
          ingressoDate: today,
          closeDate: today,
          nextReviewDate: null,
          closeType: "OBJETIVOS_ALCANCADOS",
        },
        { status: "ENCERRADO", ingressoDate: today, closeDate: today, nextReviewDate: null, closeType: null },
        { status: "ATIVO", ingressoDate: today, closeDate: null, nextReviewDate: null, closeType: null },
      ]),
    ).toEqual({ EVASAO: 2, OBJETIVOS_ALCANCADOS: 1 });
  });
});
