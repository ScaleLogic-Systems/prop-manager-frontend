drop extension if exists "pg_net";

drop policy "Allow super-admin and owners full access to eTIMS config" on "public"."agency_etims_configs";

drop policy "Allow super-admin and owners full access to eTIMS logs" on "public"."etims_invoice_logs";

drop policy "Invoice stakeholders can view audit logs" on "public"."invoice_audit_logs";

drop policy "Invoices insert policy" on "public"."invoices";

drop policy "Invoices update policy" on "public"."invoices";

drop policy "Invoices view policy" on "public"."invoices";

drop policy "Profiles access policy" on "public"."profiles";

drop policy "Properties view policy" on "public"."properties";

drop policy "Property stakeholders can create change audit logs" on "public"."property_change_audit_logs";

drop policy "Property stakeholders can view change audit logs" on "public"."property_change_audit_logs";

drop policy "Property stakeholders manage utility types" on "public"."property_utility_types";

drop policy "Tenants view policy" on "public"."tenants";

drop policy "Caretakers can view unassigned payments" on "public"."unassigned_payments";

drop policy "Unassigned payments policy" on "public"."unassigned_payments";

drop policy "Property stakeholders manage unit utility charges" on "public"."unit_utility_charges";

drop policy "Enable insert for property owners on units" on "public"."units";

drop policy "Enable select for property owners on units" on "public"."units";

drop policy "Enable update for property owners on units" on "public"."units";

drop policy "Owners can update units for their properties" on "public"."units";

drop policy "Owners can view own units" on "public"."units";

alter table "public"."agency_etims_configs" drop constraint "agency_etims_configs_profile_id_fkey";

alter table "public"."credit_notes" drop constraint "credit_notes_invoice_id_fkey";

alter table "public"."etims_invoice_logs" drop constraint "etims_invoice_logs_profile_id_fkey";

alter table "public"."invoice_audit_logs" drop constraint "invoice_audit_logs_actor_profile_id_fkey";

alter table "public"."invoice_audit_logs" drop constraint "invoice_audit_logs_invoice_id_fkey";

alter table "public"."invoice_items" drop constraint "invoice_items_invoice_id_fkey";

alter table "public"."invoices" drop constraint "invoices_issued_by_fkey";

alter table "public"."invoices" drop constraint "invoices_issuer_profile_id_fkey";

alter table "public"."invoices" drop constraint "invoices_property_id_fkey";

alter table "public"."invoices" drop constraint "invoices_tenant_id_fkey";

alter table "public"."invoices" drop constraint "invoices_unit_id_fkey";

alter table "public"."meter_readings" drop constraint "meter_readings_recorded_by_fkey";

alter table "public"."meter_readings" drop constraint "meter_readings_unit_id_fkey";

alter table "public"."payments" drop constraint "payments_invoice_id_fkey";

alter table "public"."payments" drop constraint "payments_tenant_id_fkey";

alter table "public"."properties" drop constraint "properties_caretaker_id_fkey";

alter table "public"."properties" drop constraint "properties_owner_id_fkey";

alter table "public"."properties" drop constraint "properties_property_manager_id_fkey";

alter table "public"."property_change_audit_logs" drop constraint "property_change_audit_logs_actor_profile_id_fkey";

alter table "public"."property_change_audit_logs" drop constraint "property_change_audit_logs_property_id_fkey";

alter table "public"."property_change_audit_logs" drop constraint "property_change_audit_logs_unit_id_fkey";

alter table "public"."property_utility_types" drop constraint "property_utility_types_created_by_fkey";

alter table "public"."property_utility_types" drop constraint "property_utility_types_property_id_fkey";

alter table "public"."saas_unassigned_payments" drop constraint "saas_unassigned_payments_matched_profile_id_fkey";

alter table "public"."subscription_invoices" drop constraint "subscription_invoices_property_manager_id_fkey";

alter table "public"."subscription_payments" drop constraint "subscription_payments_invoice_id_fkey";

alter table "public"."subscription_payments" drop constraint "subscription_payments_property_manager_id_fkey";

alter table "public"."tenants" drop constraint "tenants_profile_id_fkey";

alter table "public"."tenants" drop constraint "tenants_property_id_fkey";

alter table "public"."tenants" drop constraint "tenants_unit_id_fkey";

alter table "public"."unassigned_payments" drop constraint "unassigned_payments_resolved_by_fkey";

alter table "public"."unassigned_payments" drop constraint "unassigned_payments_resolved_invoice_id_fkey";

alter table "public"."unassigned_payments" drop constraint "unassigned_payments_resolved_tenant_id_fkey";

alter table "public"."unit_utility_charges" drop constraint "unit_utility_charges_unit_id_fkey";

alter table "public"."unit_utility_charges" drop constraint "unit_utility_charges_utility_type_id_fkey";

alter table "public"."units" drop constraint "units_property_id_fkey";

alter table "public"."credit_notes" alter column "etims_status" set default 'pending_transmission'::public.etims_status_type;

alter table "public"."credit_notes" alter column "etims_status" set data type public.etims_status_type using "etims_status"::text::public.etims_status_type;

alter table "public"."credit_notes" alter column "reason" set default 'CANCELLATION'::public.credit_note_reason;

alter table "public"."credit_notes" alter column "reason" set data type public.credit_note_reason using "reason"::text::public.credit_note_reason;

alter table "public"."invoice_items" alter column "tax_category" set default 'A_EXEMPT'::public.kra_tax_category;

alter table "public"."invoice_items" alter column "tax_category" set data type public.kra_tax_category using "tax_category"::text::public.kra_tax_category;

alter table "public"."invoices" alter column "etims_status" set default 'draft'::public.etims_status_type;

alter table "public"."invoices" alter column "etims_status" set data type public.etims_status_type using "etims_status"::text::public.etims_status_type;

alter table "public"."profiles" alter column "role" set default 'TENANT'::public.user_role;

alter table "public"."profiles" alter column "role" set data type public.user_role using "role"::text::public.user_role;

alter table "public"."property_utility_types" alter column "default_tax_treatment" set default 'A_EXEMPT'::public.kra_tax_category;

alter table "public"."property_utility_types" alter column "default_tax_treatment" set data type public.kra_tax_category using "default_tax_treatment"::text::public.kra_tax_category;

alter table "public"."tenants" alter column "entity_type" set default 'individual'::public.tenant_entity_type;

alter table "public"."tenants" alter column "entity_type" set data type public.tenant_entity_type using "entity_type"::text::public.tenant_entity_type;

alter table "public"."unit_utility_charges" alter column "tax_treatment" set data type public.kra_tax_category using "tax_treatment"::text::public.kra_tax_category;

alter table "public"."units" alter column "vat_treatment" set default 'A_EXEMPT'::public.kra_tax_category;

alter table "public"."units" alter column "vat_treatment" set data type public.kra_tax_category using "vat_treatment"::text::public.kra_tax_category;

alter table "public"."agency_etims_configs" add constraint "agency_etims_configs_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."agency_etims_configs" validate constraint "agency_etims_configs_profile_id_fkey";

alter table "public"."credit_notes" add constraint "credit_notes_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE RESTRICT not valid;

alter table "public"."credit_notes" validate constraint "credit_notes_invoice_id_fkey";

alter table "public"."etims_invoice_logs" add constraint "etims_invoice_logs_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."etims_invoice_logs" validate constraint "etims_invoice_logs_profile_id_fkey";

alter table "public"."invoice_audit_logs" add constraint "invoice_audit_logs_actor_profile_id_fkey" FOREIGN KEY (actor_profile_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."invoice_audit_logs" validate constraint "invoice_audit_logs_actor_profile_id_fkey";

alter table "public"."invoice_audit_logs" add constraint "invoice_audit_logs_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE not valid;

alter table "public"."invoice_audit_logs" validate constraint "invoice_audit_logs_invoice_id_fkey";

alter table "public"."invoice_items" add constraint "invoice_items_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE not valid;

alter table "public"."invoice_items" validate constraint "invoice_items_invoice_id_fkey";

alter table "public"."invoices" add constraint "invoices_issued_by_fkey" FOREIGN KEY (issued_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_issued_by_fkey";

alter table "public"."invoices" add constraint "invoices_issuer_profile_id_fkey" FOREIGN KEY (issuer_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_issuer_profile_id_fkey";

alter table "public"."invoices" add constraint "invoices_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_property_id_fkey";

alter table "public"."invoices" add constraint "invoices_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."invoices" validate constraint "invoices_tenant_id_fkey";

alter table "public"."invoices" add constraint "invoices_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_unit_id_fkey";

alter table "public"."meter_readings" add constraint "meter_readings_recorded_by_fkey" FOREIGN KEY (recorded_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."meter_readings" validate constraint "meter_readings_recorded_by_fkey";

alter table "public"."meter_readings" add constraint "meter_readings_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE not valid;

alter table "public"."meter_readings" validate constraint "meter_readings_unit_id_fkey";

alter table "public"."payments" add constraint "payments_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_invoice_id_fkey";

alter table "public"."payments" add constraint "payments_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_tenant_id_fkey";

alter table "public"."properties" add constraint "properties_caretaker_id_fkey" FOREIGN KEY (caretaker_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."properties" validate constraint "properties_caretaker_id_fkey";

alter table "public"."properties" add constraint "properties_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."properties" validate constraint "properties_owner_id_fkey";

alter table "public"."properties" add constraint "properties_property_manager_id_fkey" FOREIGN KEY (property_manager_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."properties" validate constraint "properties_property_manager_id_fkey";

alter table "public"."property_change_audit_logs" add constraint "property_change_audit_logs_actor_profile_id_fkey" FOREIGN KEY (actor_profile_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."property_change_audit_logs" validate constraint "property_change_audit_logs_actor_profile_id_fkey";

alter table "public"."property_change_audit_logs" add constraint "property_change_audit_logs_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."property_change_audit_logs" validate constraint "property_change_audit_logs_property_id_fkey";

alter table "public"."property_change_audit_logs" add constraint "property_change_audit_logs_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE not valid;

alter table "public"."property_change_audit_logs" validate constraint "property_change_audit_logs_unit_id_fkey";

alter table "public"."property_utility_types" add constraint "property_utility_types_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."property_utility_types" validate constraint "property_utility_types_created_by_fkey";

alter table "public"."property_utility_types" add constraint "property_utility_types_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."property_utility_types" validate constraint "property_utility_types_property_id_fkey";

alter table "public"."saas_unassigned_payments" add constraint "saas_unassigned_payments_matched_profile_id_fkey" FOREIGN KEY (matched_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."saas_unassigned_payments" validate constraint "saas_unassigned_payments_matched_profile_id_fkey";

alter table "public"."subscription_invoices" add constraint "subscription_invoices_property_manager_id_fkey" FOREIGN KEY (property_manager_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."subscription_invoices" validate constraint "subscription_invoices_property_manager_id_fkey";

alter table "public"."subscription_payments" add constraint "subscription_payments_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.subscription_invoices(id) ON DELETE CASCADE not valid;

alter table "public"."subscription_payments" validate constraint "subscription_payments_invoice_id_fkey";

alter table "public"."subscription_payments" add constraint "subscription_payments_property_manager_id_fkey" FOREIGN KEY (property_manager_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."subscription_payments" validate constraint "subscription_payments_property_manager_id_fkey";

alter table "public"."tenants" add constraint "tenants_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."tenants" validate constraint "tenants_profile_id_fkey";

alter table "public"."tenants" add constraint "tenants_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL not valid;

alter table "public"."tenants" validate constraint "tenants_property_id_fkey";

alter table "public"."tenants" add constraint "tenants_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL not valid;

alter table "public"."tenants" validate constraint "tenants_unit_id_fkey";

alter table "public"."unassigned_payments" add constraint "unassigned_payments_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."unassigned_payments" validate constraint "unassigned_payments_resolved_by_fkey";

alter table "public"."unassigned_payments" add constraint "unassigned_payments_resolved_invoice_id_fkey" FOREIGN KEY (resolved_invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL not valid;

alter table "public"."unassigned_payments" validate constraint "unassigned_payments_resolved_invoice_id_fkey";

alter table "public"."unassigned_payments" add constraint "unassigned_payments_resolved_tenant_id_fkey" FOREIGN KEY (resolved_tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL not valid;

alter table "public"."unassigned_payments" validate constraint "unassigned_payments_resolved_tenant_id_fkey";

alter table "public"."unit_utility_charges" add constraint "unit_utility_charges_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE not valid;

alter table "public"."unit_utility_charges" validate constraint "unit_utility_charges_unit_id_fkey";

alter table "public"."unit_utility_charges" add constraint "unit_utility_charges_utility_type_id_fkey" FOREIGN KEY (utility_type_id) REFERENCES public.property_utility_types(id) ON DELETE CASCADE not valid;

alter table "public"."unit_utility_charges" validate constraint "unit_utility_charges_utility_type_id_fkey";

alter table "public"."units" add constraint "units_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."units" validate constraint "units_property_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS public.user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$
;


  create policy "Allow super-admin and owners full access to eTIMS config"
  on "public"."agency_etims_configs"
  as permissive
  for all
  to public
using (((auth.uid() = profile_id) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role)::text = ANY (ARRAY['super_admin'::text, 'super-admin'::text])))))));



  create policy "Allow super-admin and owners full access to eTIMS logs"
  on "public"."etims_invoice_logs"
  as permissive
  for all
  to public
using (((auth.uid() = profile_id) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role)::text = ANY (ARRAY['super_admin'::text, 'super-admin'::text])))))));



  create policy "Invoice stakeholders can view audit logs"
  on "public"."invoice_audit_logs"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.invoices i
     JOIN public.properties p ON ((p.id = i.property_id)))
  WHERE ((i.id = invoice_audit_logs.invoice_id) AND ((p.owner_id = auth.uid()) OR (p.property_manager_id = auth.uid()) OR (p.caretaker_id = auth.uid()) OR (invoice_audit_logs.actor_profile_id = auth.uid()))))));



  create policy "Invoices insert policy"
  on "public"."invoices"
  as permissive
  for insert
  to public
with check ((public.get_my_role() = ANY (ARRAY['SUPER_ADMIN'::public.user_role, 'PROPERTY_MANAGER'::public.user_role, 'CARETAKER'::public.user_role])));



  create policy "Invoices update policy"
  on "public"."invoices"
  as permissive
  for update
  to public
using ((public.get_my_role() = ANY (ARRAY['SUPER_ADMIN'::public.user_role, 'PROPERTY_MANAGER'::public.user_role, 'CARETAKER'::public.user_role])));



  create policy "Invoices view policy"
  on "public"."invoices"
  as permissive
  for select
  to public
using (((tenant_id IN ( SELECT tenants.id
   FROM public.tenants
  WHERE (tenants.profile_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['SUPER_ADMIN'::public.user_role, 'LANDLORD'::public.user_role, 'PROPERTY_MANAGER'::public.user_role, 'CARETAKER'::public.user_role])))))));



  create policy "Profiles access policy"
  on "public"."profiles"
  as permissive
  for all
  to public
using (((id = auth.uid()) OR (public.get_my_role() = 'SUPER_ADMIN'::public.user_role)));



  create policy "Properties view policy"
  on "public"."properties"
  as permissive
  for select
  to public
using (((public.get_my_role() = 'SUPER_ADMIN'::public.user_role) OR (owner_id = auth.uid()) OR (property_manager_id = auth.uid()) OR (caretaker_id = auth.uid()) OR (public.get_my_role() = 'TENANT'::public.user_role)));



  create policy "Property stakeholders can create change audit logs"
  on "public"."property_change_audit_logs"
  as permissive
  for insert
  to authenticated
with check (((actor_profile_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_change_audit_logs.property_id) AND ((p.owner_id = auth.uid()) OR (p.property_manager_id = auth.uid()) OR (p.caretaker_id = auth.uid())))))));



  create policy "Property stakeholders can view change audit logs"
  on "public"."property_change_audit_logs"
  as permissive
  for select
  to authenticated
using (((actor_profile_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_change_audit_logs.property_id) AND ((p.owner_id = auth.uid()) OR (p.property_manager_id = auth.uid()) OR (p.caretaker_id = auth.uid())))))));



  create policy "Property stakeholders manage utility types"
  on "public"."property_utility_types"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_utility_types.property_id) AND ((p.owner_id = auth.uid()) OR (p.property_manager_id = auth.uid()))))))
with check ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_utility_types.property_id) AND ((p.owner_id = auth.uid()) OR (p.property_manager_id = auth.uid()))))));



  create policy "Tenants view policy"
  on "public"."tenants"
  as permissive
  for select
  to public
using (((profile_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['SUPER_ADMIN'::public.user_role, 'LANDLORD'::public.user_role, 'PROPERTY_MANAGER'::public.user_role, 'CARETAKER'::public.user_role])))))));



  create policy "Caretakers can view unassigned payments"
  on "public"."unassigned_payments"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['SUPER_ADMIN'::public.user_role, 'PROPERTY_MANAGER'::public.user_role, 'CARETAKER'::public.user_role, 'LANDLORD'::public.user_role]))))));



  create policy "Unassigned payments policy"
  on "public"."unassigned_payments"
  as permissive
  for all
  to public
using ((public.get_my_role() = ANY (ARRAY['SUPER_ADMIN'::public.user_role, 'PROPERTY_MANAGER'::public.user_role, 'LANDLORD'::public.user_role])));



  create policy "Property stakeholders manage unit utility charges"
  on "public"."unit_utility_charges"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.units u
     JOIN public.properties p ON ((p.id = u.property_id)))
  WHERE ((u.id = unit_utility_charges.unit_id) AND ((p.owner_id = auth.uid()) OR (p.property_manager_id = auth.uid()))))))
with check ((EXISTS ( SELECT 1
   FROM (public.units u
     JOIN public.properties p ON ((p.id = u.property_id)))
  WHERE ((u.id = unit_utility_charges.unit_id) AND ((p.owner_id = auth.uid()) OR (p.property_manager_id = auth.uid()))))));



  create policy "Enable insert for property owners on units"
  on "public"."units"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = units.property_id) AND (properties.owner_id = auth.uid())))));



  create policy "Enable select for property owners on units"
  on "public"."units"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = units.property_id) AND (properties.owner_id = auth.uid())))));



  create policy "Enable update for property owners on units"
  on "public"."units"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = units.property_id) AND (properties.owner_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = units.property_id) AND (properties.owner_id = auth.uid())))));



  create policy "Owners can update units for their properties"
  on "public"."units"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = units.property_id) AND (properties.owner_id = auth.uid())))));



  create policy "Owners can view own units"
  on "public"."units"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = units.property_id) AND (properties.owner_id = auth.uid())))));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Allow public reads 14gyqwd_0"
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using ((lower(bucket_id) = 'compliance-docs'::text));



  create policy "Allow public uploads to compliance-docs 14gyqwd_0"
  on "storage"."objects"
  as permissive
  for insert
  to anon, authenticated
with check ((lower(bucket_id) = 'compliance-docs'::text));



