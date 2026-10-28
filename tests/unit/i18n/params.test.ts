import { notFound } from "next/navigation";
import { resolveLocale } from "@/lib/i18n/params";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const notFoundMock = notFound as unknown as jest.Mock;

describe("resolveLocale", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
  });

  it('"en" は "en" を返し、notFound() を呼ばない', async () => {
    await expect(resolveLocale(Promise.resolve({ locale: "en" }))).resolves.toBe("en");
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it.each(["ja", "xx", "EN", "", "zz"])('"%s" は notFound() を呼ぶ', async (value) => {
    await expect(resolveLocale(Promise.resolve({ locale: value }))).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
