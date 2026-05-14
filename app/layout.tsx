useEffect(() => {
    const fetchUserRole = async () => {
      console.log("🛠️ 1. 권한 확인 프로세스 시작");
      setLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) console.error("❌ 세션 에러:", sessionError);
      
      if (session?.user) {
        console.log("🛠️ 2. 세션 확인됨, 유저 ID:", session.user.id);
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("❌ DB 조회 에러:", profileError.message);
        }

        if (profile) {
          console.log("✅ 3. DB 권한 획득 성공:", profile.role);
          setUserRole(profile.role);
        } else {
          console.warn("⚠️ 3. DB에 프로필 데이터가 없음!");
          setUserRole('user');
        }
      } else {
        console.log("🛠️ 2. 로그인 세션 없음");
        setUserRole(null);
      }
      setLoading(false);
    };

    fetchUserRole();
  }, []);
