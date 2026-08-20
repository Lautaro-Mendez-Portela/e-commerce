import { mount } from "@vue/test-utils";

import OrderStatusBadge from "../../src/components/orders/OrderStatusBadge.vue";
import OrderTimeline from "../../src/components/orders/OrderTimeline.vue";

describe("order components", () => {
  it.each([
    ["PENDING", "Procesando pago"],
    ["PAID", "Pago confirmado"],
    ["PROCESSING", "Preparando pedido"],
    ["SHIPPED", "Enviado"],
    ["DELIVERED", "Entregado"],
    ["FAILED", "Pago no completado"],
    ["REFUNDED", "Reembolsado"],
  ])("OrderStatusBadge muestra texto para %s", (status, label) => {
    const wrapper = mount(OrderStatusBadge, {
      props: { status },
    });

    expect(wrapper.text()).toContain(label);
  });

  it("OrderTimeline marca PAID como paso actual", () => {
    const wrapper = mount(OrderTimeline, {
      props: { status: "PAID" },
    });

    expect(wrapper.text()).toContain("Pago confirmado");
    expect(wrapper.text()).toContain("Actual");
  });

  it("OrderTimeline marca DELIVERED como completado", () => {
    const wrapper = mount(OrderTimeline, {
      props: { status: "DELIVERED" },
    });

    expect(wrapper.text()).toContain("Entregado");
    expect(wrapper.findAll(".order-timeline__step--complete")).toHaveLength(4);
  });

  it.each(["FAILED", "REFUNDED"])("OrderTimeline evita timeline enganosa en %s", (status) => {
    const wrapper = mount(OrderTimeline, {
      props: { status },
    });

    expect(wrapper.text()).toContain("no aplica");
    expect(wrapper.find("ol").exists()).toBe(false);
  });
});
