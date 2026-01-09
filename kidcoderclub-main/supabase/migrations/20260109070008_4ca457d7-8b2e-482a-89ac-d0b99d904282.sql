-- Allow admins to update transaction status (for confirming/rejecting payments)
CREATE POLICY "Admins can update transactions"
ON public.transactions FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());