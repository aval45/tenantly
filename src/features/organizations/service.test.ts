import type { TenantlySupabaseClient } from "@/shared/api/supabase";

import {
  createOrganizationCommandSchema,
  createSupabaseOrganizationService,
} from "./service";

describe("organization service", () => {
  test("accepts a normalized organization command", () => {
    expect(
      createOrganizationCommandSchema.parse({
        name: " Greenwood Living ",
        slug: "greenwood-living",
        idempotencyKey: "request-1234",
      }),
    ).toEqual({
      name: "Greenwood Living",
      slug: "greenwood-living",
      idempotencyKey: "request-1234",
    });
  });

  test("rejects unsafe slugs and short idempotency keys", () => {
    expect(() =>
      createOrganizationCommandSchema.parse({
        name: "Greenwood Living",
        slug: "Greenwood Living",
        idempotencyKey: "short",
      }),
    ).toThrow();
  });

  test("uses the transactional organization RPC", async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: "22222222-2222-4222-8222-222222222222",
      error: null,
    });
    const service = createSupabaseOrganizationService({
      rpc,
    } as unknown as TenantlySupabaseClient);

    await expect(
      service.createOrganization({
        name: "Greenwood Living",
        slug: "greenwood-living",
        idempotencyKey: "request-1234",
      }),
    ).resolves.toBe("22222222-2222-4222-8222-222222222222");
    expect(rpc).toHaveBeenCalledWith("create_organization_with_owner", {
      organization_name: "Greenwood Living",
      organization_slug: "greenwood-living",
      request_idempotency_key: "request-1234",
    });
  });
});
