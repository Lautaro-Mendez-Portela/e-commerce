import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";

import OrderSummary from "../../src/components/cart/OrderSummary.vue";
import ProductCard from "../../src/components/products/ProductCard.vue";

vi.mock("vue-router", () => ({
  RouterLink: {
    name: "RouterLink",
    props: ["to"],
    template: "<a><slot /></a>",
  },
  useRoute: () => ({
    fullPath: "/products",
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("cart/product components", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("OrderSummary muestra subtotal y total correctos", () => {
    const wrapper = mount(OrderSummary, {
      props: {
        subtotal: 25.5,
        itemCount: 3,
        primaryLabel: "Comprar",
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    });

    expect(wrapper.text()).toContain("3 productos");
    expect(wrapper.text()).toContain("US$");
    expect(wrapper.text()).toContain("25,50");
  });

  it("ProductCard deshabilita CTA si stock es 0", () => {
    const wrapper = mount(ProductCard, {
      props: {
        product: {
          id: 1,
          name: "Producto sin stock",
          price: 10,
          stock: 0,
        },
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const button = wrapper.findComponent({ name: "BaseButton" });

    expect(wrapper.text()).toContain("Sin stock");
    expect(button.props("disabled")).toBe(true);
  });
});
