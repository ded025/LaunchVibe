import { Nav } from "@/components/nav";
import { useState } from "react";
import { useCreateProduct, getGetDashboardProductsQueryKey, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Redirect } from "wouter";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  tagline: z.string().min(5, "Tagline must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function SubmitProduct() {
  const { isLoaded, isSignedIn } = useUser();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect to="/sign-in" />;

  const { register, handleSubmit, control, formState: { errors }, trigger } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      tagline: "",
      description: "",
      category: "",
      websiteUrl: "",
      logoUrl: "",
    }
  });

  const createProduct = useCreateProduct({
    mutation: {
      onSuccess: (product) => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        setLocation(`/products/${product.id}`);
      }
    }
  });

  const onSubmit = (data: FormValues) => {
    createProduct.mutate({
      data: {
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        category: data.category,
        websiteUrl: data.websiteUrl || null,
        logoUrl: data.logoUrl || null,
      }
    });
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(["name", "tagline"]);
    } else if (step === 2) {
      isValid = await trigger(["description"]);
    } else if (step === 3) {
      isValid = await trigger(["category", "websiteUrl"]);
    }
    
    if (isValid) {
      setStep(s => Math.min(4, s + 1));
    }
  };

  const prevStep = () => {
    setStep(s => Math.max(1, s - 1));
  };

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Nav />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl flex flex-col">
        <h1 className="text-3xl font-bold tracking-tight mb-8">List a Product</h1>
        
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 border border-border rounded-xl bg-card flex-1 flex flex-col">
          
          <div className={step === 1 ? "block" : "hidden"}>
            <h2 className="text-xl font-semibold mb-6">Basic Info</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input {...register("name")} placeholder="e.g. ProofBase" className="bg-background border-border" />
                {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input {...register("tagline")} placeholder="A quiet, powerful tool for builders." className="bg-background border-border" />
                {errors.tagline && <p className="text-destructive text-sm">{errors.tagline.message}</p>}
              </div>
            </div>
          </div>

          <div className={step === 2 ? "block" : "hidden"}>
            <h2 className="text-xl font-semibold mb-6">Description</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Product Description</Label>
                <Textarea 
                  {...register("description")} 
                  placeholder="Tell us what makes your product special..." 
                  className="min-h-[200px] bg-background border-border"
                />
                {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
              </div>
            </div>
          </div>

          <div className={step === 3 ? "block" : "hidden"}>
            <h2 className="text-xl font-semibold mb-6">Details</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Productivity">Productivity</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Dev Tools">Dev Tools</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-destructive text-sm">{errors.category.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Website URL (Optional)</Label>
                <Input {...register("websiteUrl")} placeholder="https://example.com" className="bg-background border-border" />
                {errors.websiteUrl && <p className="text-destructive text-sm">{errors.websiteUrl.message}</p>}
              </div>
            </div>
          </div>

          <div className={step === 4 ? "block" : "hidden"}>
            <h2 className="text-xl font-semibold mb-6">Review & Submit</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>Please review your details before submitting.</p>
              <p>Once submitted, your product will be live and ready to collect feedback.</p>
            </div>
          </div>

          <div className="mt-auto pt-8 flex justify-between">
            <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1 || createProduct.isPending}>
              Back
            </Button>
            
            {step < 4 ? (
              <Button type="button" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={nextStep}>
                Next Step
              </Button>
            ) : (
              <Button type="submit" disabled={createProduct.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {createProduct.isPending ? "Submitting..." : "Submit Product"}
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
