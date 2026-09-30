import { AvatarGroup } from "@/components/ui/avatar-group";

function Demo() {
  return (
    <div className="p-8 flex items-center justify-center">
      <AvatarGroup
        avatars={[
          {
            name: "Zara Kapoor",
            className: "Class 2nd - A",
            initials: "ZK",
          },
          {
            src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
            name: "Aisha Khan",
            className: "Class 2nd - A",
          },
          {
            name: "Aarav Fernandes",
            className: "Class 2nd - A",
            initials: "AF",
          },
          {
            name: "Ishan Malhotra",
            className: "Class 2nd - A",
            initials: "IM",
          },
          {
            src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
            name: "Vihaan Reddy",
            className: "Class 2nd - A",
          },
          {
            name: "Ananya Sharma",
            className: "Class 2nd - A",
            initials: "AS",
          },
        ]}
        maxVisible={5}
        size={32}
      />
    </div>
  );
}

export { Demo };
export default Demo;
