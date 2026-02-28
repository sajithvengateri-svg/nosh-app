-- Fix: Admin cannot read vendor_orders (dashboard stats fail)
-- Also add admin policies for bev_vendor_orders for completeness

CREATE POLICY "Admins can manage vendor_orders"
ON public.vendor_orders FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage bev_vendor_orders"
ON public.bev_vendor_orders FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
